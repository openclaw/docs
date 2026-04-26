---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah Plugin
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata `package.json` openclaw
sidebarTitle: Setup and config
summary: Wizard penyiapan, `setup-entry.ts`, skema konfigurasi, dan metadata `package.json`
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referensi untuk packaging Plugin (metadata `package.json`), manifest (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari walkthrough?** Panduan how-to membahas packaging dalam konteks: [Plugin saluran](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem Plugin apa yang disediakan Plugin Anda:

<Tabs>
  <Tab title="Plugin saluran">
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
          "label": "My Channel",
          "blurb": "Short description of the channel."
        }
      }
    }
    ```
  </Tab>
  <Tab title="Plugin provider / baseline ClawHub">
    ```json openclaw-clawhub-package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
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
Jika Anda memublikasikan Plugin secara eksternal di ClawHub, field `compat` dan `build` tersebut wajib. Cuplikan publikasi kanonis ada di `docs/snippets/plugin-publish/`.
</Note>

### Field `openclaw`

<ParamField path="extensions" type="string[]">
  File entry point (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri khusus penyiapan yang ringan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog saluran untuk surface penyiapan, pemilih, quickstart, dan status.
</ParamField>
<ParamField path="providers" type="string[]">
  ID provider yang didaftarkan oleh Plugin ini.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku startup.
</ParamField>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket murah untuk penemuan saluran dan surface penyiapan sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                        |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `id`                                   | `string`   | ID saluran kanonis.                                                            |
| `label`                                | `string`   | Label saluran utama.                                                           |
| `selectionLabel`                       | `string`   | Label picker/penyiapan jika perlu berbeda dari `label`.                        |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog saluran dan surface status yang lebih kaya. |
| `docsPath`                             | `string`   | Path dokumen untuk tautan penyiapan dan pemilihan.                             |
| `docsLabel`                            | `string`   | Override label yang digunakan untuk tautan dokumen jika perlu berbeda dari ID saluran. |
| `blurb`                                | `string`   | Deskripsi onboarding/katalog singkat.                                          |
| `order`                                | `number`   | Urutan sortir dalam katalog saluran.                                           |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan saluran.                              |
| `preferOver`                           | `string[]` | ID Plugin/saluran prioritas lebih rendah yang harus dikalahkan oleh saluran ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI saluran.                      |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan dokumen dalam surface pemilihan.                   |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path dokumen secara langsung alih-alih tautan dokumen berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.               |
| `markdownCapable`                      | `boolean`  | Menandai saluran sebagai mampu Markdown untuk keputusan pemformatan keluar.    |
| `exposure`                             | `object`   | Kontrol visibilitas saluran untuk surface penyiapan, daftar yang dikonfigurasi, dan dokumen. |
| `quickstartAllowFrom`                  | `boolean`  | Memasukkan saluran ini ke alur penyiapan quickstart `allowFrom` standar.       |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit bahkan saat hanya ada satu akun.               |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Lebih memilih pencarian sesi saat me-resolve target announce untuk saluran ini. |

Contoh:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: sertakan saluran dalam surface daftar gaya configured/status
- `setup`: sertakan saluran dalam picker penyiapan/konfigurasi interaktif
- `docs`: tandai saluran sebagai menghadap publik dalam surface dokumen/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Pilih `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifest.

| Field                        | Tipe                 | Artinya                                                                        |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Spesifikasi npm kanonis untuk alur install/update.                             |
| `localPath`                  | `string`             | Path instalasi development lokal atau bawaan.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang dipilih ketika keduanya tersedia.                        |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z`.                   |
| `expectedIntegrity`          | `string`             | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang dipin. |
| `allowInvalidConfigRecovery` | `boolean`            | Mengizinkan alur reinstall Plugin bawaan pulih dari kegagalan config usang tertentu. |

<AccordionGroup>
  <Accordion title="Perilaku onboarding">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk surface install-on-demand. Jika Plugin Anda mengekspos pilihan auth provider atau metadata penyiapan/katalog saluran sebelum runtime dimuat, onboarding dapat menampilkan pilihan itu, meminta pilihan install npm vs lokal, menginstal atau mengaktifkan Plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi persis dan `expectedIntegrity` adalah pin opsional. Jika `expectedIntegrity` ada, alur install/update menegakkannya. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "bagaimana memasangnya" di `package.json`.
  </Accordion>
  <Accordion title="Penegakan minHostVersion">
    Jika `minHostVersion` diset, instalasi dan pemuatan registri manifest sama-sama menegakkannya. Host yang lebih lama melewati Plugin; string versi yang tidak valid ditolak.
  </Accordion>
  <Accordion title="Instalasi npm yang dipin">
    Untuk instalasi npm yang dipin, simpan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi rusak. Ini ditujukan hanya untuk pemulihan sempit Plugin bawaan, sehingga reinstall/setup dapat memperbaiki sisa upgrade yang diketahui seperti path Plugin bawaan yang hilang atau entri `channels.<id>` usang untuk Plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal secara tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Penundaan full load

Plugin saluran dapat ikut serta dalam deferred loading dengan:

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup pra-listen, bahkan untuk saluran yang sudah dikonfigurasi. Entri penuh dimuat setelah gateway mulai listen.

<Warning>
Aktifkan deferred loading hanya ketika `setupEntry` Anda mendaftarkan semua yang dibutuhkan gateway sebelum mulai listen (pendaftaran saluran, route HTTP, metode gateway). Jika entri penuh memiliki kapabilitas startup yang wajib, pertahankan perilaku default.
</Warning>

Jika entri setup/penuh Anda mendaftarkan metode RPC gateway, pertahankan metode-metode itu pada prefiks spesifik Plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki core dan selalu di-resolve ke `operator.admin`.

## Manifest Plugin

Setiap Plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakan ini untuk memvalidasi konfigurasi tanpa menjalankan kode Plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Untuk Plugin saluran, tambahkan `kind` dan `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Bahkan Plugin tanpa konfigurasi pun harus menyertakan skema. Skema kosong itu valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Manifest Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Untuk paket Plugin, gunakan perintah ClawHub yang khusus untuk paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias publikasi lama yang khusus skill ditujukan untuk skill. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw saat hanya memerlukan surface penyiapan (onboarding, perbaikan konfigurasi, inspeksi saluran yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime berat (library kripto, pendaftaran CLI, layanan latar belakang) selama alur penyiapan.

Saluran workspace bawaan yang menyimpan ekspor aman-penyiapan dalam modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract` alih-alih `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional sehingga wiring runtime pada waktu penyiapan dapat tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Kapan OpenClaw menggunakan setupEntry alih-alih entri penuh">
    - Saluran dinonaktifkan tetapi memerlukan surface penyiapan/onboarding.
    - Saluran diaktifkan tetapi belum dikonfigurasi.
    - Deferred loading diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).
  </Accordion>
  <Accordion title="Apa yang harus didaftarkan setupEntry">
    - Objek Plugin saluran (melalui `defineSetupPluginEntry`).
    - Route HTTP apa pun yang diperlukan sebelum gateway listen.
    - Metode gateway apa pun yang dibutuhkan selama startup.

    Metode gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Apa yang TIDAK boleh disertakan setupEntry">
    - Pendaftaran CLI.
    - Layanan latar belakang.
    - Import runtime berat (kripto, SDK).
    - Metode gateway yang hanya diperlukan setelah startup.
  </Accordion>
</AccordionGroup>

### Import helper penyiapan yang sempit

Untuk jalur hot khusus penyiapan, pilih seam helper penyiapan yang sempit daripada payung `plugin-sdk/setup` yang lebih luas ketika Anda hanya membutuhkan sebagian dari surface penyiapan:

| Path import                        | Gunakan untuk                                                                          | Ekspor utama                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat penyiapan yang tetap tersedia di `setupEntry` / startup saluran tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter penyiapan akun yang sadar environment                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/install/arsip/dokumen untuk penyiapan                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan seluruh kotak peralatan penyiapan bersama, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch penyiapan tetap aman untuk jalur hot saat di-import. Pencarian surface kontrak promosi akun tunggal bawaan dilakukan secara lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak memuat penemuan surface kontrak bawaan secara eager sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik saluran

Ketika sebuah saluran di-upgrade dari konfigurasi tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai bercakupan akun yang dipromosikan ke `accounts.default`.

Saluran bawaan dapat mempersempit atau menimpa promosi itu melalui surface kontrak penyiapannya:

- `singleAccountKeysToMove`: key tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: ketika akun bernama sudah ada, hanya key ini yang dipindahkan ke akun yang dipromosikan; key kebijakan/pengiriman bersama tetap berada di root saluran
- `resolveSingleAccountPromotionTarget(...)`: memilih akun yang sudah ada mana yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke key non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
</Note>

## Skema konfigurasi

Konfigurasi Plugin divalidasi terhadap JSON Schema di manifest Anda. Pengguna mengonfigurasi Plugin melalui:

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

Untuk konfigurasi spesifik saluran, gunakan bagian konfigurasi saluran sebagai gantinya:

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

### Membangun skema konfigurasi saluran

Gunakan `buildChannelConfigSchema` untuk mengubah skema Zod menjadi wrapper `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik Plugin:

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

Untuk Plugin pihak ketiga, kontrak jalur dingin tetaplah manifest Plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar skema konfigurasi, penyiapan, dan surface UI dapat memeriksa `channels.<id>` tanpa memuat kode runtime.

## Wizard penyiapan

Plugin saluran dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`. Wizard tersebut adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

Tipe `ChannelSetupWizard` mendukung `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya. Lihat paket Plugin bawaan (misalnya Plugin Discord `src/channel.setup.ts`) untuk contoh lengkap.

<AccordionGroup>
  <Accordion title="Prompt allowFrom bersama">
    Untuk prompt allowlist DM yang hanya memerlukan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper penyiapan bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status penyiapan saluran standar">
    Untuk blok status penyiapan saluran yang hanya berbeda pada label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di setiap Plugin.
  </Accordion>
  <Accordion title="Surface penyiapan saluran opsional">
    Untuk surface penyiapan opsional yang seharusnya hanya muncul dalam konteks tertentu, gunakan `createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

    ```typescript
    import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

    const setupSurface = createOptionalChannelSetupSurface({
      channel: "my-channel",
      label: "My Channel",
      npmSpec: "@myorg/openclaw-my-channel",
      docsPath: "/channels/my-channel",
    });
    // Mengembalikan { setupAdapter, setupWizard }
    ```

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` ketika Anda hanya memerlukan salah satu setengah dari surface instalasi opsional tersebut.

    Adapter/wizard opsional yang dihasilkan gagal secara tertutup pada penulisan konfigurasi nyata. Adapter/wizard ini menggunakan ulang satu pesan wajib-instal di `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen ketika `docsPath` diset.

  </Accordion>
  <Accordion title="Helper penyiapan berbasis biner">
    Untuk UI penyiapan berbasis biner, pilih helper delegated bersama alih-alih menyalin glue biner/status yang sama ke setiap saluran:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` ketika `setupEntry` perlu meneruskan ke wizard penuh yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` ketika `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Memublikasikan dan menginstal

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu instal:

<Tabs>
  <Tab title="Otomatis (ClawHub lalu npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw mencoba ClawHub terlebih dahulu dan otomatis fallback ke npm.

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Tidak ada override `npm:` yang cocok. Gunakan spesifikasi paket npm biasa ketika Anda menginginkan jalur npm setelah fallback ClawHub:

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repo:** tempatkan di bawah tree workspace Plugin bawaan dan Plugin akan ditemukan secara otomatis saat build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan `npm install --ignore-scripts` lokal proyek (tanpa lifecycle script), dengan mengabaikan pengaturan instalasi npm global yang diwariskan. Jaga tree dependensi Plugin tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Plugin bawaan milik OpenClaw adalah satu-satunya pengecualian perbaikan startup: ketika instalasi paket melihat salah satunya diaktifkan oleh konfigurasi Plugin, konfigurasi saluran lama, atau manifest bawaan yang default-enabled, startup menginstal dependensi runtime Plugin yang hilang sebelum import. Plugin pihak ketiga tidak boleh bergantung pada instalasi startup; tetap gunakan installer Plugin yang eksplisit.
</Note>

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest lengkap
- [Entry point SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
