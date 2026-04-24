---
read_when:
    - Anda sedang menambahkan wizard setup ke plugin +#+#+#+#+#+analysis to=final code=none  全民彩票 to=final code=none
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan skema config plugin atau metadata `openclaw` di `package.json`
sidebarTitle: Setup and Config
summary: Wizard setup, `setup-entry.ts`, skema config, dan metadata `package.json`
title: Penyiapan dan config plugin
x-i18n:
    generated_at: "2026-04-24T09:20:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Referensi untuk packaging plugin (metadata `package.json`), manifest
(`openclaw.plugin.json`), entry setup, dan skema config.

<Tip>
  **Mencari walkthrough?** Panduan cara penggunaan membahas packaging dalam konteks:
  [Plugin Channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Plugin Provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata package

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem plugin
apa yang disediakan plugin Anda:

**Plugin channel:**

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

**Plugin provider / baseline publish ClawHub:**

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

Jika Anda memublikasikan plugin secara eksternal di ClawHub, field `compat` dan `build`
tersebut wajib. Snippet publish kanonis ada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Tipe       | Deskripsi                                                                                                                |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | File titik masuk (relatif terhadap root package)                                                                         |
| `setupEntry` | `string`   | Entry ringan khusus setup (opsional)                                                                                     |
| `channel`    | `object`   | Metadata katalog channel untuk surface setup, picker, quickstart, dan status                                             |
| `providers`  | `string[]` | Id provider yang didaftarkan oleh plugin ini                                                                             |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                                    |

### `openclaw.channel`

`openclaw.channel` adalah metadata package yang murah untuk discovery channel dan surface setup
sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                      |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id channel kanonis.                                                          |
| `label`                                | `string`   | Label channel utama.                                                         |
| `selectionLabel`                       | `string`   | Label picker/setup saat perlu berbeda dari `label`.                          |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan surface status yang lebih kaya. |
| `docsPath`                             | `string`   | Path dokumen untuk tautan setup dan pemilihan.                               |
| `docsLabel`                            | `string`   | Override label yang digunakan untuk tautan dokumen saat perlu berbeda dari id channel. |
| `blurb`                                | `string`   | Deskripsi onboarding/katalog singkat.                                        |
| `order`                                | `number`   | Urutan sortir di katalog channel.                                            |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                               |
| `preferOver`                           | `string[]` | Id plugin/channel prioritas lebih rendah yang harus dikalahkan oleh channel ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                    |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan dokumen pada surface pemilihan.                   |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path dokumen secara langsung alih-alih tautan dokumen berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.             |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu markdown untuk keputusan formatting keluar.    |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk surface setup, daftar terkonfigurasi, dan dokumen. |
| `quickstartAllowFrom`                  | `boolean`  | Ikutsertakan channel ini ke alur setup `allowFrom` quickstart standar.       |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit meskipun hanya ada satu akun.                |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Utamakan lookup sesi saat me-resolve target announce untuk channel ini.      |

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

- `configured`: sertakan channel dalam surface daftar bergaya configured/status
- `setup`: sertakan channel dalam picker setup/configure interaktif
- `docs`: tandai channel sebagai berhadapan dengan publik di surface dokumen/navigasi

`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Utamakan
`exposure`.

### `openclaw.install`

`openclaw.install` adalah metadata package, bukan metadata manifest.

| Field                        | Tipe                 | Artinya                                                                             |
| ---------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spec npm kanonis untuk alur install/update.                                         |
| `localPath`                  | `string`             | Path instalasi lokal untuk pengembangan atau bawaan.                                |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang dipilih saat keduanya tersedia.                               |
| `minHostVersion`             | `string`             | Versi minimum OpenClaw yang didukung dalam bentuk `>=x.y.z`.                        |
| `expectedIntegrity`          | `string`             | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang disematkan. |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur pemasangan ulang plugin bawaan pulih dari kegagalan config usang tertentu. |

Onboarding interaktif juga menggunakan `openclaw.install` untuk surface
install-on-demand. Jika plugin Anda mengekspos pilihan auth provider atau metadata setup/katalog channel
sebelum runtime dimuat, onboarding dapat menampilkan pilihan itu, meminta
pilihan install npm vs lokal, memasang atau mengaktifkan plugin, lalu melanjutkan
alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog tepercaya dengan
registry `npmSpec`; versi exact dan `expectedIntegrity` adalah pin opsional. Jika
`expectedIntegrity` ada, alur install/update menegakkannya. Simpan metadata "apa
yang harus ditampilkan" di `openclaw.plugin.json` dan metadata "bagaimana
cara memasangnya" di `package.json`.

Jika `minHostVersion` diatur, instalasi dan pemuatan manifest-registry sama-sama menegakkannya. Host yang lebih lama melewati plugin; string versi yang tidak valid ditolak.

Untuk instalasi npm yang disematkan, simpan versi exact di `npmSpec` dan tambahkan
integritas artefak yang diharapkan:

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

`allowInvalidConfigRecovery` bukan bypass umum untuk config yang rusak. Field ini
hanya untuk pemulihan plugin bawaan yang sempit, sehingga pemasangan ulang/setup dapat
memperbaiki sisa upgrade yang diketahui seperti path plugin bawaan yang hilang atau entri `channels.<id>`
yang usang untuk plugin yang sama. Jika config rusak karena alasan yang tidak terkait, install
tetap gagal secara tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Tunda pemuatan penuh

Plugin channel dapat memilih pemuatan tertunda dengan:

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup
sebelum listen, bahkan untuk channel yang sudah dikonfigurasi. Entry penuh dimuat setelah
gateway mulai listen.

<Warning>
  Hanya aktifkan pemuatan tertunda saat `setupEntry` Anda mendaftarkan semua yang
  dibutuhkan gateway sebelum mulai listen (pendaftaran channel, route HTTP,
  method gateway). Jika entry penuh memiliki kapabilitas startup yang diperlukan, pertahankan
  perilaku default.
</Warning>

Jika entry setup/penuh Anda mendaftarkan method RPC gateway, pertahankan method itu pada
prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu di-resolve
ke `operator.admin`.

## Manifest plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root package.
OpenClaw menggunakan ini untuk memvalidasi config tanpa mengeksekusi kode plugin.

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

Untuk plugin channel, tambahkan `kind` dan `channels`:

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

Bahkan plugin tanpa config pun harus menyertakan skema. Skema kosong valid:

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

## Publishing ClawHub

Untuk package plugin, gunakan perintah ClawHub khusus package:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publish lama yang hanya untuk skill adalah untuk Skills. Package plugin
selalu harus menggunakan `clawhub package publish`.

## Entry setup

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat OpenClaw saat hanya membutuhkan surface setup (onboarding, perbaikan config,
pemeriksaan channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (library kripto, pendaftaran CLI,
background service) selama alur setup.

Channel workspace bawaan yang menyimpan ekspor aman-setup di modul sidecar dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` sebagai pengganti
`defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor
`runtime` opsional sehingga wiring runtime saat setup dapat tetap ringan dan eksplisit.

**Saat OpenClaw menggunakan `setupEntry` alih-alih entry penuh:**

- Channel dinonaktifkan tetapi membutuhkan surface setup/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Yang harus didaftarkan `setupEntry`:**

- Objek plugin channel (melalui `defineSetupPluginEntry`)
- Route HTTP apa pun yang diperlukan sebelum gateway listen
- Method gateway apa pun yang dibutuhkan selama startup

Method gateway startup tersebut tetap sebaiknya menghindari namespace admin inti yang dicadangkan
seperti `config.*` atau `update.*`.

**Yang TIDAK seharusnya disertakan dalam `setupEntry`:**

- Pendaftaran CLI
- Background service
- Impor runtime yang berat (kripto, SDK)
- Method gateway yang hanya diperlukan setelah startup

### Impor helper setup yang sempit

Untuk jalur setup-only yang panas, utamakan seam helper setup yang sempit dibanding
payung `plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian dari surface setup:

| Path import                        | Gunakan untuk                                                                           | Ekspor utama                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter setup akun yang sadar environment                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | helper setup/install CLI/archive/docs                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox setup bersama penuh, termasuk helper config-patch seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch setup tetap aman pada jalur panas saat diimpor. Lookup kontrak-surface promosi akun tunggal bawaan yang dibundel
bersifat lazy, sehingga mengimpor
`plugin-sdk/setup-runtime` tidak secara eager memuat discovery contract-surface bawaan sebelum adapter benar-benar digunakan.

### Promosi satu akun milik channel

Saat sebuah channel di-upgrade dari config tingkat atas satu akun ke
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai
yang dipromosikan dan dicakup akun ke `accounts.default`.

Channel bawaan dapat mempersempit atau mengoverride promosi itu melalui
contract surface setup mereka:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke
  akun yang dipromosikan
- `namedAccountPromotionKeys`: saat named account sudah ada, hanya kunci ini yang
  dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root
  channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada mana
  yang menerima nilai yang dipromosikan

Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah
ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada
seperti `Ops`, promosi mempertahankan akun itu alih-alih membuat entri
`accounts.default` baru.

## Skema config

Config plugin divalidasi terhadap JSON Schema di manifest Anda. Pengguna
mengonfigurasi plugin melalui:

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

Plugin Anda menerima config ini sebagai `api.pluginConfig` selama pendaftaran.

Untuk config khusus channel, gunakan bagian config channel sebagai gantinya:

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

### Membangun skema config channel

Gunakan `buildChannelConfigSchema` dari `openclaw/plugin-sdk/core` untuk mengonversi
skema Zod menjadi wrapper `ChannelConfigSchema` yang divalidasi OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Wizard setup

Plugin channel dapat menyediakan wizard setup interaktif untuk `openclaw onboard`.
Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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

Tipe `ChannelSetupWizard` mendukung `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya.
Lihat package plugin bawaan (misalnya plugin Discord `src/channel.setup.ts`) untuk
contoh lengkap.

Untuk prompt allowlist DM yang hanya membutuhkan alur standar
`note -> prompt -> parse -> merge -> patch`, utamakan helper setup bersama
dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status setup channel yang hanya bervariasi dalam label, skor, dan baris tambahan opsional, utamakan `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih merakit objek `status` yang sama secara manual di
setiap plugin.

Untuk surface setup opsional yang hanya boleh muncul dalam konteks tertentu, gunakan
`createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

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

`plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah
`createOptionalChannelSetupAdapter(...)` dan
`createOptionalChannelSetupWizard(...)` saat Anda hanya membutuhkan salah satu bagian dari surface instalasi opsional tersebut.

Adapter/wizard opsional yang dihasilkan gagal secara tertutup pada penulisan config nyata. Mereka menggunakan ulang satu pesan install-required di seluruh `validateInput`,
`applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen saat `docsPath`
diatur.

Untuk UI setup berbasis biner, utamakan helper terdelegasi bersama alih-alih
menyalin glue biner/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya bervariasi dalam label,
  petunjuk, skor, dan deteksi biner
- `createCliPathTextInput(...)` untuk input teks berbasis path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan secara lazy ke
  wizard penuh yang lebih berat
- `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Publishing dan pemasangan

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu pasang:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan menggunakan fallback ke npm secara otomatis. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # hanya ClawHub
```

Tidak ada override `npm:` yang sepadan. Gunakan spec package npm normal saat Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** letakkan di bawah pohon workspace plugin bawaan dan plugin akan
ditemukan secara otomatis selama build.

**Pengguna dapat memasang:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi dari sumber npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle scripts). Pertahankan pohon dependensi plugin
  tetap JS/TS murni dan hindari package yang memerlukan build `postinstall`.
</Info>

Plugin bawaan milik OpenClaw adalah satu-satunya pengecualian perbaikan saat startup: ketika instalasi terpaket melihat salah satu plugin tersebut diaktifkan oleh config plugin, config channel lama, atau manifest default-enabled bawaannya, startup memasang dependensi runtime plugin yang hilang sebelum impor. Plugin pihak ketiga tidak boleh bergantung pada instalasi saat startup; tetap gunakan installer plugin eksplisit.

## Terkait

- [Titik Masuk SDK](/id/plugins/sdk-entrypoints) -- `definePluginEntry` dan `defineChannelPluginEntry`
- [Manifest Plugin](/id/plugins/manifest) -- referensi skema manifest lengkap
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan langkah demi langkah untuk memulai
