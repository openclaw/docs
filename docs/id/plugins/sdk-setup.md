---
read_when:
    - Anda menambahkan wisaya penyiapan ke sebuah plugin
    - Anda perlu memahami setup-entry.ts dibandingkan dengan index.ts
    - Anda sedang mendefinisikan skema konfigurasi plugin atau metadata openclaw package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-07-20T03:52:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d4438acb2de929c4eca7332245737e614ad00d8a6712191d9d9bd004da84c3b6
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan praktis membahas pengemasan dalam konteksnya: [Plugin kanal](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin penyedia](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan bidang `openclaw` yang memberi tahu sistem plugin tentang apa yang disediakan plugin Anda:

<Tabs>
  <Tab title="Plugin kanal">
    ```json
    {
      "name": "@myorg/openclaw-my-channel",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "my-channel",
          "label": "Kanal Saya",
          "blurb": "Deskripsi singkat kanal."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin penyedia / dasar ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "dependencies": {
        "typebox": "1.1.39"
      },
      "peerDependencies": {
        "openclaw": ">=2026.3.24-beta.2"
      },
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Publikasi secara eksternal di ClawHub memerlukan `compat` dan `build`. Cuplikan publikasi kanonis tersedia di `docs/snippets/plugin-publish/`.
</Note>

### Bidang `openclaw`

<ParamField path="extensions" type="string[]">
  File titik masuk (relatif terhadap akar paket). Entri sumber yang valid untuk pengembangan ruang kerja dan checkout git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Padanan JavaScript hasil build untuk `extensions`, yang diutamakan saat OpenClaw memuat paket npm terinstal. Lihat [Titik masuk SDK](/id/plugins/sdk-entrypoints) untuk urutan resolusi sumber/hasil build.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Padanan JavaScript hasil build untuk `setupEntry`. Mengharuskan `setupEntry` juga ditetapkan.
</ParamField>
<ParamField path="plugin" type="object">
  Identitas plugin cadangan `{ id, label }`, digunakan ketika plugin tidak memiliki metadata kanal/penyedia untuk memperoleh id atau label.
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog kanal untuk permukaan penyiapan, pemilih, mulai cepat, dan status.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku saat dimulai.
</ParamField>
<ParamField path="compat" type="object">
  Rentang versi `pluginApi` yang didukung plugin ini. Wajib untuk publikasi eksternal di ClawHub.
</ParamField>

<Note>
Id penyedia (`providers: string[]`) merupakan metadata manifes, bukan metadata paket. Deklarasikan dalam `openclaw.plugin.json`, bukan di sini — lihat [Manifes plugin](/id/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan kanal dan permukaan penyiapan sebelum runtime dimuat.

| Bidang                                 | Jenis      | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id kanal kanonis.                                                             |
| `label`                                | `string`   | Label kanal utama.                                                            |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan ketika harus berbeda dari `label`.                    |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog kanal dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur dokumentasi untuk tautan penyiapan dan pemilihan.                        |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan dokumentasi ketika harus berbeda dari id kanal. |
| `blurb`                                | `string`   | Deskripsi singkat orientasi/katalog.                                           |
| `order`                                | `number`   | Urutan pengurutan dalam katalog kanal.                                         |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan kanal.                                |
| `preferOver`                           | `string[]` | Id plugin/kanal berprioritas lebih rendah yang harus diungguli kanal ini.      |
| `systemImage`                          | `string`   | Nama ikon/gambar sistem opsional untuk katalog UI kanal.                       |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan dokumentasi pada permukaan pemilihan.               |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur dokumentasi secara langsung, bukan tautan dokumentasi berlabel dalam teks pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan ke teks pemilihan.                     |
| `markdownCapable`                      | `boolean`  | Menandai kanal sebagai mendukung markdown untuk keputusan pemformatan keluar.  |
| `exposure`                             | `object`   | Kontrol visibilitas kanal untuk penyiapan, daftar yang dikonfigurasi, dan permukaan dokumentasi. |
| `quickstartAllowFrom`                  | `boolean`  | Sertakan kanal ini dalam alur penyiapan mulai cepat `allowFrom` standar.       |
| `forceAccountBinding`                  | `boolean`  | Wajibkan pengikatan akun secara eksplisit meskipun hanya ada satu akun.         |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Utamakan pencarian sesi saat menentukan target pengumuman untuk kanal ini.     |

Contoh:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "Kanal Saya",
      "selectionLabel": "Kanal Saya (dihosting sendiri)",
      "detailLabel": "Bot Kanal Saya",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Integrasi obrolan yang dihosting sendiri dan berbasis Webhook.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Panduan:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` mendukung:

- `configured`: sertakan kanal dalam permukaan daftar bergaya konfigurasi/status
- `setup`: sertakan kanal dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: tandai kanal sebagai ditujukan untuk publik dalam permukaan dokumentasi/navigasi

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Bidang                       | Jenis                               | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk instalasi/pembaruan dan alur instalasi sesuai permintaan saat orientasi. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur cadangan instalasi/pembaruan.                  |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau instalasi bawaan.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber instalasi yang diutamakan ketika tersedia beberapa sumber.                 |
| `minHostVersion`             | `string`                            | Versi minimum OpenClaw yang didukung, `>=x.y.z` atau `>=x.y.z-prerelease`.        |
| `expectedIntegrity`          | `string`                            | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang dipatok. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur instalasi ulang plugin bawaan pulih dari kegagalan konfigurasi usang tertentu. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm khusus platform wajib yang diverifikasi selama instalasi npm.           |

<AccordionGroup>
  <Accordion title="Perilaku orientasi">
    Orientasi interaktif menggunakan `openclaw.install` untuk permukaan instalasi sesuai permintaan: jika plugin Anda mengekspos pilihan autentikasi penyedia atau metadata penyiapan/katalog kanal sebelum runtime dimuat, orientasi dapat meminta instalasi melalui ClawHub, npm, atau lokal, menginstal atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan ClawHub menggunakan `clawhubSpec` dan diutamakan jika tersedia; pilihan npm memerlukan metadata katalog tepercaya dengan `npmSpec` registri (versi persis dan `expectedIntegrity` merupakan patokan opsional, yang diberlakukan saat instalasi/pembaruan jika ditetapkan). Simpan "apa yang ditampilkan" dalam `openclaw.plugin.json` dan "cara menginstalnya" dalam `package.json`.
  </Accordion>
  <Accordion title="Pemberlakuan minHostVersion">
    Jika `minHostVersion` ditetapkan, instalasi dan pemuatan registri manifes nonbawaan sama-sama memberlakukannya. Host lama melewati plugin eksternal; string versi yang tidak valid ditolak. Plugin sumber bawaan diasumsikan memiliki versi yang sama dengan checkout host.
  </Accordion>
  <Accordion title="Instalasi npm yang dipatok">
    Untuk instalasi npm yang dipatok, simpan versi persis dalam `npmSpec` dan tambahkan integritas artefak yang diharapkan:

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="Cakupan allowInvalidConfigRecovery">
    `allowInvalidConfigRecovery` bukan mekanisme umum untuk melewati konfigurasi yang rusak. Ini hanya untuk pemulihan sempit plugin bawaan, yang memungkinkan instalasi ulang/penyiapan memperbaiki sisa peningkatan yang diketahui seperti jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin yang sama. Jika konfigurasi rusak karena alasan lain, instalasi tetap gagal secara tertutup dan meminta operator menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Penundaan pemuatan penuh

Plugin kanal dapat memilih pemuatan tertunda dengan:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Jika diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase awal sebelum mulai mendengarkan, bahkan untuk kanal yang sudah dikonfigurasi. Entri lengkap dimuat setelah Gateway mulai mendengarkan.

<Warning>
Hanya aktifkan pemuatan tertunda ketika `setupEntry` Anda mendaftarkan semua yang dibutuhkan gateway sebelum mulai mendengarkan (pendaftaran kanal, rute HTTP, metode gateway). Jika entri lengkap memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/lengkap Anda mendaftarkan metode RPC gateway, pertahankan metode tersebut pada prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu dinormalisasi menjadi `operator.admin`.

## Manifes plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakannya untuk memvalidasi konfigurasi tanpa mengeksekusi kode plugin.

```json
{
  "id": "my-plugin",
  "name": "Plugin Saya",
  "description": "Menambahkan kapabilitas Plugin Saya ke OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Rahasia verifikasi Webhook"
      }
    }
  }
}
```

Untuk plugin kanal, tambahkan `channels` (dan plugin penyedia menambahkan `providers`):

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Bahkan plugin tanpa konfigurasi harus menyertakan skema. Skema kosong tetap valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Manifes plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Paket Skills dan plugin menggunakan perintah publikasi ClawHub yang terpisah. Untuk paket plugin, gunakan perintah khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` adalah perintah yang berbeda untuk memublikasikan folder skill, bukan paket plugin. Lihat [Publikasi di ClawHub](/id/clawhub/publishing).
</Note>

## Entri penyiapan

`setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw ketika hanya memerlukan permukaan penyiapan (orientasi awal, perbaikan konfigurasi, pemeriksaan kanal yang dinonaktifkan):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka kriptografi, pendaftaran CLI, layanan latar belakang) selama alur penyiapan.

Kanal ruang kerja yang dibundel dan mempertahankan ekspor yang aman untuk penyiapan dalam modul pendamping dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract`, alih-alih `defineSetupPluginEntry(...)`. Kontrak yang dibundel tersebut juga mendukung ekspor opsional `runtime` agar pengawatan runtime saat penyiapan tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Saat OpenClaw menggunakan setupEntry alih-alih entri lengkap">
    - Kanal dinonaktifkan tetapi memerlukan permukaan penyiapan/orientasi awal.
    - Kanal diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Yang harus didaftarkan setupEntry">
    - Objek plugin kanal (melalui `defineSetupPluginEntry`).
    - Rute HTTP apa pun yang diperlukan sebelum gateway mulai mendengarkan.
    - Metode gateway apa pun yang diperlukan selama startup.

    Metode gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Yang TIDAK boleh disertakan setupEntry">
    - Pendaftaran CLI.
    - Layanan latar belakang.
    - Impor runtime yang berat (kriptografi, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper penyiapan yang sempit

Untuk jalur khusus penyiapan yang sering digunakan, pilih seam helper penyiapan yang sempit daripada payung `plugin-sdk/setup` yang lebih luas ketika Anda hanya memerlukan sebagian permukaan penyiapan:

| Jalur impor                | Kegunaan                                                                                  | Ekspor utama                                                                                                                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime` | helper runtime saat penyiapan yang tetap tersedia dalam `setupEntry` / startup kanal tertunda | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-tools`   | helper CLI/arsip/dokumentasi untuk penyiapan/instalasi                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gunakan seam `plugin-sdk/setup` yang lebih luas ketika Anda menginginkan kotak alat penyiapan bersama secara lengkap, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gunakan `createSetupTranslator(...)` untuk teks tetap wizard penyiapan. Ini menggunakan nilai tidak kosong pertama dari `OPENCLAW_LOCALE`, `LC_ALL`, `LC_MESSAGES`, dan `LANG`, dalam urutan tersebut, lalu kembali ke bahasa Inggris. Atur `OPENCLAW_LOCALE=en` untuk penggantian bahasa Inggris yang eksplisit. Pertahankan teks penyiapan khusus plugin dalam kode milik plugin dan gunakan kunci katalog bersama hanya untuk label penyiapan umum, teks status, serta teks penyiapan plugin resmi yang dibundel.

Adaptor patch penyiapan tetap aman untuk jalur yang sering digunakan saat diimpor. Pencarian permukaan kontrak promosi akun tunggal yang dibundel bersifat malas, sehingga mengimpor `plugin-sdk/setup-runtime` tidak segera memuat penemuan permukaan kontrak yang dibundel sebelum adaptor benar-benar digunakan.

### Promosi akun tunggal milik kanal

Ketika kanal meningkatkan konfigurasi tingkat atas akun tunggal menjadi `channels.<id>.accounts.*`, perilaku bersama default memindahkan nilai cakupan akun yang dipromosikan ke `accounts.default`.

Kanal yang dibundel dapat mempersempit atau mengganti promosi tersebut melalui permukaan kontrak penyiapannya:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: ketika akun bernama sudah ada, hanya kunci-kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root kanal
- `resolveSingleAccountPromotionTarget(...)`: memilih akun yang sudah ada untuk menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh yang dibundel saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci nonkanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
</Note>

## Skema konfigurasi

Konfigurasi plugin divalidasi terhadap JSON Schema dalam manifes Anda. Pengguna mengonfigurasi plugin melalui:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Plugin Anda menerima konfigurasi ini sebagai `api.pluginConfig` selama pendaftaran.

Untuk konfigurasi khusus kanal, gunakan bagian konfigurasi kanal sebagai gantinya:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Membuat skema konfigurasi kanal

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi pembungkus `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Jika Anda sudah menulis kontrak sebagai JSON Schema atau TypeBox, gunakan helper langsung agar OpenClaw dapat melewati konversi Zod-ke-JSON-Schema pada jalur metadata:

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

Untuk plugin pihak ketiga, kontrak jalur dingin tetap berupa manifes plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar permukaan skema konfigurasi, penyiapan, dan UI dapat memeriksa `channels.<id>` tanpa memuat kode runtime.

## Wizard penyiapan

Plugin kanal dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`. Wizard tersebut adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Terhubung",
    unconfiguredLabel: "Belum dikonfigurasi",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Token bot",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Gunakan MY_CHANNEL_BOT_TOKEN dari lingkungan?",
      keepPrompt: "Pertahankan token saat ini?",
      inputPrompt: "Masukkan token bot Anda:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` juga mendukung `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya. Lihat `src/setup-core.ts` milik plugin Discord untuk contoh lengkap yang dibundel.

<AccordionGroup>
  <Accordion title="Prompt allowFrom bersama">
    Untuk prompt daftar yang diizinkan DM yang hanya memerlukan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper penyiapan bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status penyiapan kanal standar">
    Untuk blok status penyiapan kanal yang hanya berbeda dalam label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup`, alih-alih membuat sendiri objek `status` yang sama di setiap plugin.
  </Accordion>
  <Accordion title="Permukaan penyiapan kanal opsional">
    Untuk permukaan penyiapan opsional yang hanya boleh muncul dalam konteks tertentu, gunakan `createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "Kanal Saya",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Mengembalikan { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` ketika Anda hanya memerlukan separuh dari permukaan instalasi opsional tersebut.

    Adaptor/wizard opsional yang dihasilkan menolak secara aman pada penulisan konfigurasi nyata. Keduanya menggunakan kembali satu pesan wajib-instalasi untuk `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumentasi saat `docsPath` ditetapkan.

  </Accordion>
  <Accordion title="Helper penyiapan berbasis biner">
    Untuk UI penyiapan berbasis biner, utamakan helper delegasi bersama daripada menyalin logika penghubung biner/status yang sama ke setiap kanal:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda dalam label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan secara tunda ke wizard lengkap yang lebih berat
    - `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Memublikasikan dan menginstal

**Plugin eksternal:** publikasikan ke [ClawHub](/id/clawhub), lalu instal:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Spesifikasi paket polos diinstal dari npm selama peralihan peluncuran, kecuali namanya cocok dengan id plugin bawaan atau resmi. Dalam hal ini, OpenClaw menggunakan salinan lokal/resmi tersebut sebagai gantinya. Gunakan `clawhub:`, `npm:`, `git:`, atau `npm-pack:` untuk pemilihan sumber yang deterministik — lihat [Kelola plugin](/id/plugins/manage-plugins).

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Gunakan npm saat paket belum dipindahkan ke ClawHub, atau saat Anda memerlukan
    jalur instalasi npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repositori:** tempatkan di bawah pohon ruang kerja plugin bawaan; plugin tersebut ditemukan secara otomatis selama build.

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket ke proyek per-plugin di bawah `~/.openclaw/npm/projects` dengan skrip siklus hidup dinonaktifkan (`--ignore-scripts`). Pastikan pohon dependensi plugin sepenuhnya menggunakan JS/TS dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Proses awal Gateway tidak menginstal dependensi plugin. Alur instalasi npm/git/ClawHub menangani konvergensi dependensi; plugin lokal harus sudah memiliki dependensi yang terinstal.
</Note>

Metadata paket bawaan bersifat eksplisit, bukan disimpulkan dari JavaScript hasil build saat Gateway dimulai. Dependensi runtime harus berada dalam paket plugin yang memilikinya; proses awal OpenClaw terpaket tidak pernah memperbaiki atau mencerminkan dependensi plugin.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifes plugin](/id/plugins/manifest) — referensi skema manifes lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
