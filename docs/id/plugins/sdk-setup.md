---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah plugin
    - Anda perlu memahami setup-entry.ts vs index.ts
    - Anda sedang mendefinisikan schema config plugin atau metadata openclaw di package.json
sidebarTitle: Setup and Config
summary: Wizard penyiapan, setup-entry.ts, schema config, dan metadata package.json
title: Penyiapan dan Config Plugin
x-i18n:
    generated_at: "2026-04-05T14:03:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Penyiapan dan Config Plugin

Referensi untuk packaging plugin (metadata `package.json`), manifest
(`openclaw.plugin.json`), entri penyiapan, dan schema config.

<Tip>
  **Mencari panduan langkah demi langkah?** Panduan cara melakukannya mencakup packaging dalam konteks:
  [Channel Plugins](/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan
  [Provider Plugins](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem plugin apa
yang disediakan plugin Anda:

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

Jika Anda memublikasikan plugin secara eksternal di ClawHub, field `compat` dan `build`
tersebut wajib ada. Snippet publikasi kanonis berada di
`docs/snippets/plugin-publish/`.

### Field `openclaw`

| Field        | Type       | Deskripsi                                                                                             |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | File entry point (relatif terhadap root paket)                                                        |
| `setupEntry` | `string`   | Entry ringan khusus penyiapan (opsional)                                                              |
| `channel`    | `object`   | Metadata katalog channel untuk permukaan penyiapan, picker, quickstart, dan status                   |
| `providers`  | `string[]` | Id provider yang didaftarkan oleh plugin ini                                                          |
| `install`    | `object`   | Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Flag perilaku startup                                                                                 |

### `openclaw.channel`

`openclaw.channel` adalah metadata paket yang ringan untuk penemuan channel dan
permukaan penyiapan sebelum runtime dimuat.

| Field                                  | Type       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label picker/penyiapan saat perlu berbeda dari `label`.                      |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Path dokumentasi untuk tautan penyiapan dan pemilihan.                        |
| `docsLabel`                            | `string`   | Label override yang digunakan untuk tautan dokumentasi saat perlu berbeda dari id channel. |
| `blurb`                                | `string`   | Deskripsi singkat onboarding/katalog.                                         |
| `order`                                | `number`   | Urutan penyortiran dalam katalog channel.                                     |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                                |
| `preferOver`                           | `string[]` | Id plugin/channel prioritas lebih rendah yang harus dikalahkan channel ini.   |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan dokumentasi di permukaan pemilihan.                |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path dokumentasi secara langsung alih-alih tautan dokumentasi berlabel dalam copy pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam copy pemilihan.                 |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu markdown untuk keputusan format keluaran.      |
| `showConfigured`                       | `boolean`  | Mengontrol apakah permukaan daftar channel yang dikonfigurasi menampilkan channel ini. |
| `quickstartAllowFrom`                  | `boolean`  | Menjadikan channel ini ikut serta dalam alur penyiapan `allowFrom` quickstart standar. |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit meskipun hanya ada satu akun.                 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Lebih memilih lookup sesi saat menyelesaikan target announce untuk channel ini. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifest.

| Field                        | Type                 | Artinya                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spesifikasi npm kanonis untuk alur install/update.                               |
| `localPath`                  | `string`             | Path instalasi bundled atau pengembangan lokal.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang diutamakan saat keduanya tersedia.                         |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam format `>=x.y.z`.                     |
| `allowInvalidConfigRecovery` | `boolean`            | Mengizinkan alur instal ulang bundled-plugin memulihkan kegagalan config basi tertentu. |

Jika `minHostVersion` disetel, instalasi dan pemuatan manifest-registry sama-sama menegakkannya.
Host yang lebih lama melewati plugin; string versi yang tidak valid ditolak.

`allowInvalidConfigRecovery` bukan bypass umum untuk config yang rusak. Ini
untuk pemulihan bundled-plugin yang sempit saja, sehingga instal ulang/penyiapan dapat memperbaiki sisa upgrade
tertentu yang diketahui seperti path bundled plugin yang hilang atau entri `channels.<id>`
yang basi untuk plugin yang sama. Jika config rusak karena alasan yang tidak terkait, instalasi
tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.

### Menunda pemuatan penuh

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
pra-listen, bahkan untuk channel yang sudah dikonfigurasi. Entry penuh dimuat setelah
gateway mulai listening.

<Warning>
  Aktifkan pemuatan tertunda hanya jika `setupEntry` Anda mendaftarkan semua yang
  dibutuhkan gateway sebelum mulai listening (pendaftaran channel, rute HTTP,
  metode gateway). Jika entry penuh memiliki kemampuan startup yang wajib, pertahankan
  perilaku default.
</Warning>

Jika setup/full entry Anda mendaftarkan metode RPC gateway, simpan semuanya pada
awalan khusus plugin. Namespace admin inti yang dicadangkan (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diresolve
ke `operator.admin`.

## Manifest plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root paket.
OpenClaw menggunakannya untuk memvalidasi config tanpa mengeksekusi kode plugin.

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

Bahkan plugin tanpa config pun harus menyertakan schema. Schema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Plugin Manifest](/plugins/manifest) untuk referensi schema lengkap.

## Publikasi ClawHub

Untuk paket plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Alias publikasi khusus Skills yang lama adalah untuk Skills. Paket plugin
harus selalu menggunakan `clawhub package publish`.

## Entry penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang
dimuat OpenClaw saat hanya memerlukan permukaan penyiapan (onboarding, perbaikan config,
pemeriksaan channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka crypto, registrasi CLI,
layanan latar belakang) selama alur penyiapan.

**Saat OpenClaw menggunakan `setupEntry` alih-alih entry penuh:**

- Channel dinonaktifkan tetapi memerlukan permukaan setup/onboarding
- Channel diaktifkan tetapi belum dikonfigurasi
- Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Apa yang harus didaftarkan `setupEntry`:**

- Objek plugin channel (melalui `defineSetupPluginEntry`)
- Rute HTTP apa pun yang diperlukan sebelum gateway listen
- Metode gateway apa pun yang diperlukan selama startup

Metode gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan
seperti `config.*` atau `update.*`.

**Apa yang TIDAK boleh disertakan `setupEntry`:**

- Registrasi CLI
- Layanan latar belakang
- Import runtime yang berat (crypto, SDK)
- Metode gateway yang hanya diperlukan setelah startup

### Import helper penyiapan yang sempit

Untuk path setup-only panas, utamakan seam helper penyiapan yang sempit daripada
payung `plugin-sdk/setup` yang lebih luas saat Anda hanya memerlukan sebagian dari permukaan penyiapan:

| Import path                        | Gunakan untuk                                                                           | Export utama                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter setup akun yang sadar environment                                               | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/archive/dokumentasi/install saat setup                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan kotak peralatan penyiapan bersama penuh,
termasuk helper patch config seperti
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch setup tetap aman untuk import pada hot-path. Lookup contract-surface promosi single-account
bundled yang dibawanya bersifat lazy, jadi mengimpor
`plugin-sdk/setup-runtime` tidak secara eager memuat penemuan contract-surface
bundled sebelum adapter benar-benar digunakan.

### Promosi single-account yang dimiliki channel

Saat sebuah channel ditingkatkan dari config tingkat atas single-account ke
`channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai
bercakupan akun yang dipromosikan ke `accounts.default`.

Bundled channel dapat mempersempit atau menimpa promosi itu melalui setup
contract surface mereka:

- `singleAccountKeysToMove`: key tingkat atas tambahan yang harus dipindahkan ke
  akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya key ini yang dipindahkan ke
  akun yang dipromosikan; key kebijakan/pengiriman bersama tetap di root channel
- `resolveSingleAccountPromotionTarget(...)`: memilih akun yang ada mana yang
  menerima nilai yang dipromosikan

Matrix adalah contoh bundled saat ini. Jika tepat satu akun Matrix bernama sudah
ada, atau jika `defaultAccount` menunjuk ke key non-kanonis yang sudah ada
seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri
`accounts.default` baru.

## Schema config

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

Plugin Anda menerima config ini sebagai `api.pluginConfig` saat pendaftaran.

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

### Membangun schema config channel

Gunakan `buildChannelConfigSchema` dari `openclaw/plugin-sdk/core` untuk mengubah
schema Zod menjadi wrapper `ChannelConfigSchema` yang divalidasi OpenClaw:

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya.
Lihat paket bundled plugin (misalnya plugin Discord `src/channel.setup.ts`) untuk
contoh lengkap.

Untuk prompt allowlist DM yang hanya memerlukan alur standar
`note -> prompt -> parse -> merge -> patch`, utamakan helper setup bersama
dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)`, dan
`createNestedChannelParsedAllowFromPrompt(...)`.

Untuk blok status setup channel yang hanya berbeda pada label, skor, dan
baris tambahan opsional, utamakan `createStandardChannelSetupStatus(...)` dari
`openclaw/plugin-sdk/setup` alih-alih membuat sendiri objek `status` yang sama di
setiap plugin.

Untuk permukaan penyiapan opsional yang hanya boleh muncul dalam konteks tertentu, gunakan
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
`createOptionalChannelSetupWizard(...)` saat Anda hanya memerlukan salah satu sisi dari
permukaan instalasi opsional tersebut.

Adapter/wizard opsional yang dihasilkan gagal tertutup pada penulisan config nyata. Mereka
menggunakan kembali satu pesan install-required di `validateInput`,
`applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumentasi saat `docsPath`
disetel.

Untuk UI setup berbasis biner, utamakan helper delegasi bersama daripada
menyalin glue biner/status yang sama ke setiap channel:

- `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label,
  hint, skor, dan deteksi biner
- `createCliPathTextInput(...)` untuk input teks berbasis path
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan
  `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke
  wizard penuh yang lebih berat secara lazy
- `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu
  mendelegasikan keputusan `textInputs[*].shouldPrompt`

## Memublikasikan dan menginstal

**Plugin eksternal:** publikasikan ke [ClawHub](/tools/clawhub) atau npm, lalu instal:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw mencoba ClawHub terlebih dahulu dan otomatis fallback ke npm. Anda juga dapat
memaksa ClawHub secara eksplisit:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub saja
```

Tidak ada override `npm:` yang cocok. Gunakan spesifikasi paket npm normal saat Anda
menginginkan jalur npm setelah fallback ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugin dalam repo:** letakkan di bawah bundled plugin workspace tree dan plugin akan otomatis
ditemukan selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan
  `npm install --ignore-scripts` (tanpa lifecycle scripts). Jaga dependency tree plugin
  tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

## Terkait

- [SDK Entry Points](/plugins/sdk-entrypoints) -- `definePluginEntry` dan `defineChannelPluginEntry`
- [Plugin Manifest](/plugins/manifest) -- referensi schema manifest lengkap
- [Building Plugins](/plugins/building-plugins) -- panduan mulai langkah demi langkah
