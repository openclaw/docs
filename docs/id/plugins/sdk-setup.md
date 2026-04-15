---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah Plugin
    - Anda perlu memahami `setup-entry.ts` vs `index.ts`
    - Anda sedang mendefinisikan skema config Plugin atau metadata openclaw di `package.json`
sidebarTitle: Setup and Config
summary: Wizard penyiapan, `setup-entry.ts`, skema config, dan metadata `package.json`
title: Penyiapan Plugin dan Config
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf28e25e381a4a38ac478e531586f59612e1a278732597375f87c2eeefc521b
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Penyiapan Plugin dan Config

Referensi untuk pengemasan Plugin (metadata `package.json`), manifes
(`openclaw.plugin.json`), entri penyiapan, dan skema config.

<Tip>
  **Mencari panduan langkah demi langkah?** Panduan cara melakukannya membahas pengemasan dalam konteks:
  [Plugin Channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Plugin Provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem plugin apa yang
disediakan oleh Plugin Anda:

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

**Plugin provider / baseline publikasi ClawHub:**

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

Jika Anda memublikasikan Plugin secara eksternal di ClawHub, field `compat` dan `build`
tersebut wajib diisi. Cuplikan publikasi kanonis ada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Type       | Deskripsi                                                                                              |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | File entry point (relatif terhadap root paket)                                                         |
| `setupEntry` | `string`   | Entri ringan khusus penyiapan (opsional)                                                               |
| `channel`    | `object`   | Metadata katalog channel untuk penyiapan, pemilih, panduan cepat, dan permukaan status                |
| `providers`  | `string[]` | ID provider yang didaftarkan oleh Plugin ini                                                           |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                  |

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan channel dan
permukaan penyiapan sebelum runtime dimuat.

| Field                                  | Type       | Artinya                                                                      |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                          |
| `label`                                | `string`   | Label utama channel.                                                         |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan jika perlu berbeda dari `label`.                     |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Path dokumen untuk tautan penyiapan dan pemilihan.                           |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan dokumen jika perlu berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi singkat onboarding/katalog.                                        |
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                         |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                               |
| `preferOver`                           | `string[]` | ID Plugin/channel berprioritas lebih rendah yang harus dikalahkan oleh channel ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                    |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan dokumen di permukaan pemilihan.                  |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path dokumen secara langsung alih-alih tautan dokumen berlabel dalam teks pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam teks pemilihan.                |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu markdown untuk keputusan pemformatan keluar.   |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk penyiapan, daftar yang sudah dikonfigurasi, dan permukaan dokumen. |
| `quickstartAllowFrom`                  | `boolean`  | Mengikutsertakan channel ini ke alur penyiapan `allowFrom` quickstart standar. |
| `forceAccountBinding`                  | `boolean`  | Wajibkan pengikatan akun eksplisit bahkan jika hanya ada satu akun.          |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Prioritaskan pencarian sesi saat menyelesaikan target pengumuman untuk channel ini. |

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

- `configured`: sertakan channel dalam permukaan daftar bergaya configured/status
- `setup`: sertakan channel dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: tandai channel sebagai publik di permukaan dokumen/navigasi

`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Gunakan
`exposure`.

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Field                        | Type                 | Artinya                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spesifikasi npm kanonis untuk alur install/update.                               |
| `localPath`                  | `string`             | Path instalasi lokal pengembangan atau bundled.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang dipilih saat keduanya tersedia.                            |
| `minHostVersion`             | `string`             | Versi minimum OpenClaw yang didukung dalam bentuk `>=x.y.z`.                     |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang bundled-plugin memulihkan kegagalan config usang tertentu. |

Jika `minHostVersion` disetel, instalasi dan pemuatan manifest-registry sama-sama menegakkannya.
Host yang lebih lama melewati Plugin tersebut; string versi yang tidak valid akan ditolak.

`allowInvalidConfigRecovery` bukan bypass umum untuk config yang rusak. Ini
hanya untuk pemulihan bundled-plugin yang sempit, agar instal ulang/penyiapan dapat memperbaiki
sisa peningkatan versi yang sudah diketahui seperti path bundled plugin yang hilang atau entri
`channels.<id>` usang untuk Plugin yang sama. Jika config rusak karena alasan lain, instalasi
tetap gagal secara aman dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Penundaan pemuatan penuh

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

Jika diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup
pra-listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah
Gateway mulai mendengarkan.

<Warning>
  Hanya aktifkan pemuatan tertunda jika `setupEntry` Anda mendaftarkan semua hal yang
  dibutuhkan Gateway sebelum mulai mendengarkan (pendaftaran channel, route HTTP,
  metode Gateway). Jika entri penuh memiliki kemampuan startup yang diperlukan, pertahankan
  perilaku default.
</Warning>

Jika entri setup/penuh Anda mendaftarkan metode Gateway RPC, pertahankan pada
prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diselesaikan
ke `operator.admin`.

## Manifes Plugin

Setiap Plugin native harus menyertakan `openclaw.plugin.json` di root paket.
OpenClaw menggunakannya untuk memvalidasi config tanpa mengeksekusi kode Plugin.

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

Untuk Plugin channel, tambahkan `kind` dan `channels`:

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

Bahkan Plugin tanpa config pun harus menyertakan skema. Skema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Plugin Manifest](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Untuk paket Plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publikasi lama khusus skill adalah untuk Skills. Paket Plugin harus
selalu menggunakan `clawhub package publish`.

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat oleh OpenClaw saat hanya membutuhkan permukaan penyiapan (onboarding, perbaikan config,
inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (library kriptografi, pendaftaran CLI,
layanan latar belakang) selama alur penyiapan.

Bundled workspace channel yang menyimpan ekspor aman-penyiapan dalam modul sidecar dapat
menggunakan `defineBundledChannelSetupEntry(...)` dari
`openclaw/plugin-sdk/channel-entry-contract` alih-alih
`defineSetupPluginEntry(...)`. Kontrak bundled itu juga mendukung ekspor `runtime`
opsional agar wiring runtime saat penyiapan tetap ringan dan eksplisit.

**Saat OpenClaw menggunakan `setupEntry` alih-alih entri penuh:**

- Channel dinonaktifkan tetapi membutuhkan permukaan penyiapan/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Yang harus didaftarkan oleh `setupEntry`:**

- Objek Plugin channel (melalui `defineSetupPluginEntry`)
- Route HTTP apa pun yang diperlukan sebelum Gateway listen
- Metode Gateway apa pun yang diperlukan selama startup

Metode Gateway startup tersebut tetap harus menghindari namespace admin inti yang
dicadangkan seperti `config.*` atau `update.*`.

**Yang TIDAK boleh disertakan dalam `setupEntry`:**

- Pendaftaran CLI
- Layanan latar belakang
- Impor runtime berat (crypto, SDK)
- Metode Gateway yang hanya dibutuhkan setelah startup

### Impor helper penyiapan yang sempit

Untuk path khusus penyiapan yang panas, prioritaskan seam helper penyiapan yang sempit dibandingkan
payung `plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian dari permukaan penyiapan:

| Path impor                         | Gunakan untuk                                                                            | Ekspor utama                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat penyiapan yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter penyiapan akun yang sadar lingkungan                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper penyiapan/install CLI/arsip/dokumen                                               | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan kotak alat penyiapan bersama yang lengkap,
termasuk helper patch config seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch penyiapan tetap aman untuk hot path saat diimpor. Pencarian permukaan kontrak promosi akun tunggal
bundled bersifat lazy, sehingga mengimpor
`plugin-sdk/setup-runtime` tidak akan memuat penemuan permukaan kontrak bundled secara eager
sebelum adapter benar-benar digunakan.

### Promosi akun tunggal yang dimiliki channel

Saat sebuah channel ditingkatkan dari config tingkat atas akun tunggal ke
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai
bercakupan akun yang dipromosikan ke `accounts.default`.

Channel bundled dapat mempersempit atau menimpa promosi tersebut melalui permukaan kontrak
penyiapannya:

- `singleAccountKeysToMove`: key tingkat atas tambahan yang harus dipindahkan ke
  akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya key ini yang dipindahkan
  ke akun yang dipromosikan; key kebijakan/pengiriman bersama tetap berada di root
  channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada mana yang
  menerima nilai yang dipromosikan

Matrix adalah contoh bundled saat ini. Jika tepat satu akun Matrix bernama
sudah ada, atau jika `defaultAccount` menunjuk ke key non-kanonis yang sudah ada
seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri
`accounts.default` baru.

## Skema config

Config Plugin divalidasi terhadap JSON Schema dalam manifes Anda. Pengguna
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
skema Zod menjadi wrapper `ChannelConfigSchema` yang divalidasi oleh OpenClaw:

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

## Wizard penyiapan

Plugin channel dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`.
Wizard tersebut adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan banyak lagi.
Lihat paket Plugin bundled (misalnya Plugin Discord `src/channel.setup.ts`) untuk
contoh lengkap.

Untuk prompt allowlist DM yang hanya membutuhkan alur standar
`note -> prompt -> parse -> merge -> patch`, prioritaskan helper penyiapan bersama
dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status penyiapan channel yang hanya berbeda pada label, skor, dan baris tambahan
opsional, prioritaskan `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di
setiap Plugin.

Untuk permukaan penyiapan opsional yang seharusnya hanya muncul dalam konteks tertentu, gunakan
`createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah
`createOptionalChannelSetupAdapter(...)` dan
`createOptionalChannelSetupWizard(...)` saat Anda hanya membutuhkan salah satu bagian dari
permukaan instalasi opsional tersebut.

Adapter/wizard opsional yang dihasilkan gagal secara aman pada penulisan config nyata. Mereka
menggunakan kembali satu pesan wajib-instalasi di `validateInput`,
`applyAccountConfig`, dan `finalize`, lalu menambahkan tautan dokumen saat `docsPath`
disetel.

Untuk UI penyiapan berbasis biner, prioritaskan helper delegasi bersama alih-alih
menyalin glue biner/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label,
  petunjuk, skor, dan deteksi biner
- `createCliPathTextInput(...)` untuk input teks berbasis path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke
  wizard penuh yang lebih berat secara lazy
- `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Publikasi dan instalasi

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub) atau npm, lalu instal:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan secara otomatis fallback ke npm. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

Tidak ada override `npm:` yang cocok. Gunakan spesifikasi paket npm normal saat Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** letakkan di bawah tree workspace plugin bundled dan plugin tersebut akan otomatis
ditemukan selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle script). Pertahankan tree dependensi Plugin
  murni JS/TS dan hindari paket yang memerlukan build `postinstall`.
</Info>

## Terkait

- [SDK Entry Points](/id/plugins/sdk-entrypoints) -- `definePluginEntry` dan `defineChannelPluginEntry`
- [Plugin Manifest](/id/plugins/manifest) -- referensi skema manifes lengkap
- [Membangun Plugin](/id/plugins/building-plugins) -- panduan memulai langkah demi langkah
