---
read_when:
    - Anda menambahkan wizard penyiapan ke Plugin
    - Anda perlu memahami setup-entry.ts dibandingkan dengan index.ts
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata openclaw di package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-04-30T10:04:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan Plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara pakai membahas pengemasan dalam konteks: [Plugin channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem Plugin apa yang disediakan Plugin Anda:

<Tabs>
  <Tab title="Plugin channel">
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
Jika Anda menerbitkan Plugin secara eksternal di ClawHub, field `compat` dan `build` tersebut wajib ada. Cuplikan publikasi kanonis tersedia di `docs/snippets/plugin-publish/`.
</Note>

### Field `openclaw`

<ParamField path="extensions" type="string[]">
  File titik masuk (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri khusus penyiapan yang ringan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog channel untuk penyiapan, pemilih, quickstart, dan permukaan status.
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

`openclaw.channel` adalah metadata paket ringan untuk penemuan channel dan permukaan penyiapan sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan ketika harus berbeda dari `label`.                    |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Path dokumentasi untuk tautan penyiapan dan pemilihan.                        |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan dokumentasi ketika harus berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi singkat untuk onboarding/katalog.                                   |
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                          |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan channel.                             |
| `preferOver`                           | `string[]` | ID Plugin/channel berprioritas lebih rendah yang harus dikalahkan channel ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan dokumentasi di permukaan pemilihan.               |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path dokumentasi secara langsung, bukan tautan dokumentasi berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mendukung markdown untuk keputusan pemformatan keluar. |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk penyiapan, daftar terkonfigurasi, dan permukaan dokumentasi. |
| `quickstartAllowFrom`                  | `boolean`  | Ikutkan channel ini ke alur penyiapan quickstart `allowFrom` standar.         |
| `forceAccountBinding`                  | `boolean`  | Wajibkan binding akun eksplisit bahkan ketika hanya ada satu akun.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Utamakan pencarian sesi saat menyelesaikan target pengumuman untuk channel ini. |

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

- `configured`: sertakan channel dalam permukaan daftar bergaya terkonfigurasi/status
- `setup`: sertakan channel dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: tandai channel sebagai menghadap publik di permukaan dokumentasi/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias legacy. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Field                        | Tipe                 | Artinya                                                                          |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spesifikasi npm kanonis untuk alur instalasi/pembaruan.                         |
| `localPath`                  | `string`             | Path pengembangan lokal atau instalasi bawaan.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi yang diutamakan ketika keduanya tersedia.                      |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z`.                    |
| `expectedIntegrity`          | `string`             | String integritas npm dist yang diharapkan, biasanya `sha512-...`, untuk instalasi berpinned. |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang Plugin bawaan pulih dari kegagalan konfigurasi usang tertentu. |

<AccordionGroup>
  <Accordion title="Perilaku onboarding">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan instalasi sesuai kebutuhan. Jika Plugin Anda mengekspos pilihan autentikasi provider atau metadata penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan tersebut, meminta instalasi npm vs lokal, menginstal atau mengaktifkan Plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi persis dan `expectedIntegrity` adalah pin opsional. Jika `expectedIntegrity` ada, alur instalasi/pembaruan akan menegakkannya. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="Penegakan minHostVersion">
    Jika `minHostVersion` diatur, instalasi dan pemuatan registry manifes sama-sama menegakkannya. Host yang lebih lama melewati Plugin; string versi yang tidak valid ditolak.
  </Accordion>
  <Accordion title="Instalasi npm berpinned">
    Untuk instalasi npm berpinned, simpan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi yang rusak. Ini hanya untuk pemulihan Plugin bawaan yang sempit, sehingga instal ulang/penyiapan dapat memperbaiki sisa upgrade yang diketahui seperti path Plugin bawaan yang hilang atau entri `channels.<id>` usang untuk Plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Penundaan pemuatan penuh

Plugin channel dapat ikut serta dalam pemuatan tertunda dengan:

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup pra-listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah Gateway mulai mendengarkan.

<Warning>
Aktifkan pemuatan tertunda hanya ketika `setupEntry` Anda mendaftarkan semua yang dibutuhkan Gateway sebelum mulai mendengarkan (pendaftaran channel, rute HTTP, metode Gateway). Jika entri penuh memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC Gateway, pertahankan pada prefiks khusus Plugin. Namespace admin core yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki core dan selalu diselesaikan ke `operator.admin`.

## Manifes Plugin

Setiap Plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakan ini untuk memvalidasi konfigurasi tanpa mengeksekusi kode Plugin.

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

Bahkan Plugin tanpa konfigurasi harus menyertakan skema. Skema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [Manifes Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Untuk paket Plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias publikasi legacy khusus skill ditujukan untuk skills. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw ketika hanya membutuhkan permukaan penyiapan (onboarding, perbaikan konfigurasi, inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka kripto, registrasi CLI, layanan latar belakang) selama alur penyiapan.

Channel workspace bawaan yang menyimpan ekspor aman-setup di modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract` sebagai pengganti `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional sehingga pengawatan runtime pada waktu setup dapat tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Channel dinonaktifkan tetapi memerlukan permukaan setup/onboarding.
    - Channel diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Objek Plugin channel (melalui `defineSetupPluginEntry`).
    - Route HTTP apa pun yang diperlukan sebelum Gateway listen.
    - Metode Gateway apa pun yang diperlukan selama startup.

    Metode Gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Registrasi CLI.
    - Layanan latar belakang.
    - Impor runtime berat (kripto, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper setup sempit

Untuk jalur panas khusus setup, pilih seam helper setup yang sempit dibanding payung `plugin-sdk/setup` yang lebih luas ketika Anda hanya memerlukan sebagian permukaan setup:

| Jalur impor                        | Gunakan untuk                                                                                | Ekspor kunci                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime waktu setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter setup akun yang sadar lingkungan                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper CLI/arsip/dokumen untuk setup/instalasi                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Gunakan seam `plugin-sdk/setup` yang lebih luas ketika Anda menginginkan toolbox setup bersama yang lengkap, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch setup tetap aman untuk jalur panas saat diimpor. Lookup permukaan kontrak promosi akun tunggal bawaannya bersifat lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak langsung memuat discovery permukaan kontrak bawaan sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik channel

Ketika channel ditingkatkan dari konfigurasi tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai bercakupan akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi itu melalui permukaan kontrak setup mereka:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: ketika akun bernama sudah ada, hanya kunci-kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
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

Plugin Anda menerima konfigurasi ini sebagai `api.pluginConfig` selama registrasi.

Untuk konfigurasi khusus channel, gunakan bagian konfigurasi channel sebagai gantinya:

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

### Membangun skema konfigurasi channel

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi wrapper `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik Plugin:

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

Untuk Plugin pihak ketiga, kontrak jalur dingin tetap manifest Plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` sehingga skema konfigurasi, setup, dan permukaan UI dapat memeriksa `channels.<id>` tanpa memuat kode runtime.

## Wizard setup

Plugin channel dapat menyediakan wizard setup interaktif untuk `openclaw onboard`. Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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
  <Accordion title="Shared allowFrom prompts">
    Untuk prompt daftar izin DM yang hanya membutuhkan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper setup bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Untuk blok status setup channel yang hanya berbeda pada label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat ulang objek `status` yang sama secara manual di setiap Plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
    Untuk permukaan setup opsional yang hanya boleh muncul dalam konteks tertentu, gunakan `createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` ketika Anda hanya memerlukan salah satu bagian dari permukaan instalasi opsional tersebut.

    Adapter/wizard opsional yang dihasilkan fail closed pada penulisan konfigurasi nyata. Keduanya menggunakan ulang satu pesan wajib-instal di seluruh `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan docs ketika `docsPath` disetel.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Untuk UI setup berbasis biner, pilih helper delegasi bersama alih-alih menyalin glue biner/status yang sama ke setiap channel:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label, hint, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` ketika `setupEntry` perlu meneruskan ke wizard penuh yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` ketika `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Publikasi dan instalasi

**Plugin eksternal:** publikasikan ke [ClawHub](/id/tools/clawhub), lalu instal:

<Tabs>
  <Tab title="Auto (ClawHub then npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw mencoba ClawHub terlebih dahulu dan otomatis fallback ke npm.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Gunakan npm ketika sebuah paket belum pindah ke ClawHub, atau ketika Anda memerlukan
    jalur instalasi npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin bawaan dan Plugin akan ditemukan otomatis selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menjalankan `npm install --ignore-scripts` lokal proyek (tanpa skrip lifecycle), mengabaikan pengaturan instalasi npm global yang diwarisi. Jaga pohon dependensi Plugin tetap murni JS/TS dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Plugin milik OpenClaw yang dibundel adalah satu-satunya pengecualian perbaikan startup: saat instalasi paket melihat ada yang diaktifkan oleh konfigurasi plugin, konfigurasi saluran lama, atau manifest bawaan yang aktif secara default, startup menginstal dependensi runtime plugin tersebut yang hilang sebelum impor. Operator dapat memeriksa atau memperbaiki tahap tersebut dengan `openclaw plugins deps`. Plugin pihak ketiga sebaiknya tidak mengandalkan instalasi startup; tetap gunakan penginstal plugin eksplisit.
</Note>

Dependensi runtime tingkat paket yang dibundel adalah metadata eksplisit, bukan disimpulkan dari JavaScript yang dibangun saat startup gateway. Jika dependensi root OpenClaw bersama harus tersedia di dalam mirror runtime plugin bundel eksternal, deklarasikan di `openclaw.bundle.mirroredRootRuntimeDependencies` dalam manifest paket root.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
