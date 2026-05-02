---
read_when:
    - Anda sedang menambahkan asisten penyiapan ke sebuah Plugin
    - Anda perlu memahami perbedaan setup-entry.ts dan index.ts
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata openclaw pada package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-05-02T20:59:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan Plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara kerja membahas pengemasan dalam konteks: [Plugin channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan kolom `openclaw` yang memberi tahu sistem Plugin apa yang disediakan Plugin Anda:

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
Jika Anda menerbitkan Plugin secara eksternal di ClawHub, kolom `compat` dan `build` tersebut wajib ada. Cuplikan publikasi kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Kolom `openclaw`

<ParamField path="extensions" type="string[]">
  Berkas titik masuk (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog channel untuk permukaan penyiapan, pemilih, quickstart, dan status.
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

| Kolom                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan ketika perlu berbeda dari `label`.                    |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur docs untuk tautan penyiapan dan pemilihan.                              |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan docs ketika perlu berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi singkat untuk onboarding/katalog.                                   |
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                          |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan channel.                             |
| `preferOver`                           | `string[]` | ID Plugin/channel berprioritas lebih rendah yang harus dikalahkan channel ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan docs di permukaan pemilihan.                       |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur docs secara langsung, bukan tautan docs berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu Markdown untuk keputusan pemformatan keluar.   |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk permukaan penyiapan, daftar terkonfigurasi, dan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Mengikutkan channel ini ke alur penyiapan `allowFrom` quickstart standar.     |
| `forceAccountBinding`                  | `boolean`  | Mewajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun.       |
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

- `configured`: menyertakan channel dalam permukaan daftar bergaya terkonfigurasi/status
- `setup`: menyertakan channel dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: menandai channel sebagai tampil untuk publik di permukaan docs/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Kolom                        | Tipe                                | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk instalasi/pembaruan dan alur onboarding install-on-demand. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur fallback instalasi/pembaruan.                  |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau instalasi bawaan.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber instalasi pilihan ketika beberapa sumber tersedia.                         |
| `minHostVersion`             | `string`                            | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z` atau `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi terpaku. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur instal ulang Plugin bawaan pulih dari kegagalan konfigurasi basi tertentu. |

<AccordionGroup>
  <Accordion title="Perilaku onboarding">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan install-on-demand. Jika Plugin Anda mengekspos pilihan auth provider atau metadata penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan tersebut, meminta instalasi ClawHub, npm, atau lokal, menginstal atau mengaktifkan Plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding ClawHub menggunakan `clawhubSpec` dan diutamakan saat ada; pilihan npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi persis dan `expectedIntegrity` adalah pin npm opsional. Jika `expectedIntegrity` ada, alur instalasi/pembaruan akan menerapkannya untuk npm. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="Penerapan minHostVersion">
    Jika `minHostVersion` ditetapkan, instalasi dan pemuatan registry manifes non-bawaan sama-sama menerapkannya. Host lama melewati Plugin eksternal; string versi yang tidak valid ditolak. Plugin sumber bawaan diasumsikan seversi dengan checkout host.
  </Accordion>
  <Accordion title="Instalasi npm terpaku">
    Untuk instalasi npm terpaku, simpan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi rusak. Ini hanya untuk pemulihan sempit Plugin bawaan, sehingga instal ulang/penyiapan dapat memperbaiki sisa peningkatan versi yang diketahui seperti jalur Plugin bawaan yang hilang atau entri `channels.<id>` basi untuk Plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Pemuatan penuh tertunda

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup sebelum listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah Gateway mulai listen.

<Warning>
Aktifkan pemuatan tertunda hanya ketika `setupEntry` Anda mendaftarkan semua yang dibutuhkan Gateway sebelum mulai listen (pendaftaran channel, route HTTP, metode Gateway). Jika entri penuh memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC Gateway, pertahankan pada prefiks khusus Plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diselesaikan ke `operator.admin`.

## Manifes Plugin

Setiap Plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakannya untuk memvalidasi konfigurasi tanpa mengeksekusi kode Plugin.

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

## Penerbitan ClawHub

Untuk paket Plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias publikasi lama khusus skill ditujukan untuk skills. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri setup

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw saat hanya membutuhkan permukaan setup (onboarding, perbaikan config, inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka kripto, registrasi CLI, layanan latar belakang) selama alur setup.

Channel workspace bawaan yang menyimpan ekspor aman-setup dalam modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract`, bukan `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional agar wiring runtime saat setup tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - Channel dinonaktifkan tetapi membutuhkan permukaan setup/onboarding.
    - Channel diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="What setupEntry must register">
    - Objek Plugin channel (melalui `defineSetupPluginEntry`).
    - Route HTTP apa pun yang diperlukan sebelum gateway listen.
    - Metode Gateway apa pun yang diperlukan selama startup.

    Metode Gateway startup tersebut tetap harus menghindari namespace admin core yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - Registrasi CLI.
    - Layanan latar belakang.
    - Import runtime berat (kripto, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Import helper setup sempit

Untuk path panas yang hanya setup, pilih seam helper setup yang sempit daripada payung `plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian permukaan setup:

| Path import                        | Gunakan untuk                                                                                | Ekspor kunci                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter setup akun yang sadar lingkungan                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | helper setup/install CLI/arsip/dokumen                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox setup bersama lengkap, termasuk helper patch config seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch setup tetap aman untuk path panas saat diimpor. Lookup permukaan kontrak promosi akun tunggal bawaan bersifat lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak memuat discovery permukaan kontrak bawaan secara eager sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik channel

Saat channel meningkatkan config tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai tercakup akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi itu melalui permukaan kontrak setupnya:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
</Note>

## Skema config

Config Plugin divalidasi terhadap JSON Schema dalam manifest Anda. Pengguna mengonfigurasi Plugin melalui:

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

Plugin Anda menerima config ini sebagai `api.pluginConfig` selama registrasi.

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

### Membuat skema config channel

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi wrapper `ChannelConfigSchema` yang digunakan oleh artefak config milik Plugin:

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

Jika Anda sudah menulis kontrak sebagai JSON Schema atau TypeBox, gunakan helper langsung agar OpenClaw dapat melewati konversi Zod-ke-JSON-Schema pada path metadata:

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

Untuk Plugin pihak ketiga, kontrak cold-path tetap merupakan manifest Plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar skema config, setup, dan permukaan UI dapat menginspeksi `channels.<id>` tanpa memuat kode runtime.

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
    Untuk prompt allowlist DM yang hanya membutuhkan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper setup bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Untuk blok status setup channel yang hanya berbeda menurut label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di setiap Plugin.
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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` saat Anda hanya membutuhkan salah satu bagian dari permukaan install opsional itu.

    Adapter/wizard opsional yang dihasilkan fail closed pada penulisan config nyata. Keduanya menggunakan kembali satu pesan perlu-install di `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen saat `docsPath` ditetapkan.

  </Accordion>
  <Accordion title="Binary-backed setup helpers">
    Untuk UI setup berbasis binary, pilih helper delegasi bersama alih-alih menyalin glue binary/status yang sama ke setiap channel:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda menurut label, petunjuk, skor, dan deteksi binary
    - `createCliPathTextInput(...)` untuk input teks berbasis path
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke wizard lengkap yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Menerbitkan dan menginstal

**Plugin eksternal:** terbitkan ke [ClawHub](/id/tools/clawhub), lalu instal:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Spec paket tanpa awalan diinstal dari npm selama cutover peluncuran.

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    Gunakan npm saat paket belum dipindahkan ke ClawHub, atau saat Anda membutuhkan
    path install npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin bawaan dan Plugin tersebut akan ditemukan secara otomatis selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket di bawah `~/.openclaw/npm` dengan skrip siklus hidup dinonaktifkan. Jaga pohon dependensi Plugin tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Startup Gateway tidak menginstal dependensi Plugin. Alur instalasi npm/git/ClawHub menangani konvergensi dependensinya sendiri; Plugin lokal harus sudah memiliki dependensinya terinstal.
</Note>

Metadata paket bawaan bersifat eksplisit, bukan disimpulkan dari JavaScript hasil build saat startup Gateway. Dependensi runtime berada di paket Plugin yang memilikinya; startup OpenClaw terpaket tidak pernah memperbaiki atau mencerminkan dependensi Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
