---
read_when:
    - Anda sedang menambahkan asisten penyiapan ke sebuah Plugin
    - Anda perlu memahami setup-entry.ts dibandingkan dengan index.ts
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata openclaw di package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-05-02T09:29:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara pakai membahas pengemasan dalam konteks: [Plugin channel](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin provider](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan bidang `openclaw` yang memberi tahu sistem plugin apa yang disediakan plugin Anda:

<Tabs>
  <Tab title="Channel plugin">
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
  <Tab title="Provider plugin / ClawHub baseline">
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
Jika Anda menerbitkan plugin secara eksternal di ClawHub, bidang `compat` dan `build` tersebut wajib ada. Cuplikan penerbitan kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Bidang `openclaw`

<ParamField path="extensions" type="string[]">
  File titik masuk (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog channel untuk permukaan penyiapan, pemilih, quickstart, dan status.
</ParamField>
<ParamField path="providers" type="string[]">
  ID provider yang didaftarkan oleh plugin ini.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku startup.
</ParamField>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan channel dan permukaan penyiapan sebelum runtime dimuat.

| Bidang                                 | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID channel kanonis.                                                           |
| `label`                                | `string`   | Label channel utama.                                                          |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan saat perlu berbeda dari `label`.                      |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog channel dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur docs untuk tautan penyiapan dan pemilihan.                              |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan docs saat perlu berbeda dari ID channel. |
| `blurb`                                | `string`   | Deskripsi singkat onboarding/katalog.                                         |
| `order`                                | `number`   | Urutan pengurutan dalam katalog channel.                                      |
| `aliases`                              | `string[]` | Alias lookup tambahan untuk pemilihan channel.                                |
| `preferOver`                           | `string[]` | ID plugin/channel berprioritas lebih rendah yang harus dikalahkan channel ini. |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI channel.                     |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan docs pada permukaan pemilihan.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur docs secara langsung alih-alih tautan docs berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mampu menggunakan markdown untuk keputusan pemformatan keluar. |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk permukaan penyiapan, daftar terkonfigurasi, dan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Mengikutsertakan channel ini ke alur penyiapan standar quickstart `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Mewajibkan pengikatan akun eksplisit meskipun hanya ada satu akun.            |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Mengutamakan lookup sesi saat menyelesaikan target pengumuman untuk channel ini. |

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
- `docs`: tandai channel sebagai menghadap publik dalam permukaan docs/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias legacy. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Bidang                       | Tipe                 | Artinya                                                                           |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Spesifikasi npm kanonis untuk alur instalasi/pembaruan.                           |
| `localPath`                  | `string`             | Jalur pengembangan lokal atau instalasi bundled.                                  |
| `defaultChoice`              | `"npm"` \| `"local"` | Sumber instalasi pilihan saat keduanya tersedia.                                  |
| `minHostVersion`             | `string`             | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z` atau `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`             | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang dipin. |
| `allowInvalidConfigRecovery` | `boolean`            | Memungkinkan alur instal ulang plugin bundled pulih dari kegagalan stale-config tertentu. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan install-on-demand. Jika plugin Anda mengekspos pilihan auth provider atau metadata penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan tersebut, meminta instalasi npm vs lokal, menginstal atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi eksak dan `expectedIntegrity` adalah pin opsional. Jika `expectedIntegrity` ada, alur instalasi/pembaruan akan menegakkannya. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Jika `minHostVersion` ditetapkan, instalasi dan pemuatan manifest-registry non-bundled sama-sama menegakkannya. Host lama melewati plugin eksternal; string versi tidak valid ditolak. Plugin sumber bundled diasumsikan memiliki versi yang sama dengan checkout host.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Untuk instalasi npm yang dipin, simpan versi eksak di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi yang rusak. Ini hanya untuk pemulihan plugin bundled yang sempit, sehingga instal ulang/penyiapan dapat memperbaiki sisa peningkatan yang diketahui seperti jalur plugin bundled yang hilang atau entri `channels.<id>` stale untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Pemuatan penuh tertunda

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup sebelum listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah gateway mulai listen.

<Warning>
Hanya aktifkan pemuatan tertunda saat `setupEntry` Anda mendaftarkan semua yang dibutuhkan gateway sebelum mulai listen (pendaftaran channel, route HTTP, metode gateway). Jika entri penuh memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC gateway, pertahankan pada awalan khusus plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki core dan selalu diselesaikan ke `operator.admin`.

## Manifes plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakan ini untuk memvalidasi konfigurasi tanpa mengeksekusi kode plugin.

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

Bahkan plugin tanpa konfigurasi harus menyertakan skema. Skema kosong valid:

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

## Penerbitan ClawHub

Untuk paket plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias penerbitan legacy khusus skill adalah untuk skills. Paket plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw saat hanya membutuhkan permukaan penyiapan (orientasi awal, perbaikan konfigurasi, inspeksi saluran yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka kripto, pendaftaran CLI, layanan latar belakang) selama alur penyiapan.

Saluran workspace bawaan yang menyimpan ekspor aman-penyiapan di modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract`, bukan `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional agar wiring runtime saat penyiapan tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Kapan OpenClaw menggunakan setupEntry alih-alih entri penuh">
    - Saluran dinonaktifkan tetapi membutuhkan permukaan penyiapan/orientasi awal.
    - Saluran diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Apa yang harus didaftarkan setupEntry">
    - Objek Plugin saluran (melalui `defineSetupPluginEntry`).
    - Rute HTTP apa pun yang diperlukan sebelum Gateway listen.
    - Metode Gateway apa pun yang diperlukan selama startup.

    Metode Gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Apa yang TIDAK boleh disertakan setupEntry">
    - Pendaftaran CLI.
    - Layanan latar belakang.
    - Impor runtime berat (kripto, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper penyiapan yang sempit

Untuk jalur panas khusus penyiapan, utamakan seam helper penyiapan yang sempit dibanding payung `plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian permukaan penyiapan:

| Jalur impor                        | Gunakan untuk                                                                            | Ekspor utama                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat penyiapan yang tetap tersedia di `setupEntry` / startup saluran tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | adapter penyiapan akun yang sadar lingkungan                                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | helper CLI/arsip/dokumen untuk penyiapan/instalasi                                       | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox penyiapan bersama yang lengkap, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch penyiapan tetap aman untuk jalur panas saat diimpor. Lookup permukaan-kontrak promosi akun tunggal bawaannya bersifat lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak langsung memuat penemuan permukaan-kontrak bawaan sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik saluran

Saat saluran ditingkatkan dari konfigurasi tingkat-atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai cakupan akun yang dipromosikan ke `accounts.default`.

Saluran bawaan dapat mempersempit atau menimpa promosi tersebut melalui permukaan kontrak penyiapannya:

- `singleAccountKeysToMove`: kunci tingkat-atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root saluran
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
</Note>

## Skema konfigurasi

Konfigurasi Plugin divalidasi terhadap JSON Schema di manifes Anda. Pengguna mengonfigurasi Plugin melalui:

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

Untuk konfigurasi khusus saluran, gunakan bagian konfigurasi saluran sebagai gantinya:

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

### Membuat skema konfigurasi saluran

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

Untuk Plugin pihak ketiga, kontrak jalur dingin tetap berupa manifes Plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar skema konfigurasi, penyiapan, dan permukaan UI dapat menginspeksi `channels.<id>` tanpa memuat kode runtime.

## Wizard penyiapan

Plugin saluran dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`. Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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
    Untuk prompt daftar izin DM yang hanya membutuhkan alur standar `note -> prompt -> parse -> merge -> patch`, utamakan helper penyiapan bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status penyiapan saluran standar">
    Untuk blok status penyiapan saluran yang hanya bervariasi berdasarkan label, skor, dan baris tambahan opsional, utamakan `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat manual objek `status` yang sama di setiap Plugin.
  </Accordion>
  <Accordion title="Permukaan penyiapan saluran opsional">
    Untuk permukaan penyiapan opsional yang hanya boleh muncul dalam konteks tertentu, gunakan `createOptionalChannelSetupSurface` dari `openclaw/plugin-sdk/channel-setup`:

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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` saat Anda hanya membutuhkan salah satu separuh dari permukaan instalasi opsional tersebut.

    Adapter/wizard opsional yang dihasilkan gagal tertutup pada penulisan konfigurasi nyata. Keduanya menggunakan ulang satu pesan perlu-instal di `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen saat `docsPath` diatur.

  </Accordion>
  <Accordion title="Helper penyiapan berbasis biner">
    Untuk UI penyiapan berbasis biner, utamakan helper delegasi bersama alih-alih menyalin glue biner/status yang sama ke setiap saluran:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya bervariasi berdasarkan label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke wizard penuh yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Menerbitkan dan menginstal

**Plugin eksternal:** terbitkan ke [ClawHub](/id/tools/clawhub), lalu instal:

<Tabs>
  <Tab title="Otomatis (ClawHub lalu npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw mencoba ClawHub terlebih dahulu dan fallback ke npm secara otomatis.

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spec paket npm">
    Gunakan npm saat sebuah paket belum dipindahkan ke ClawHub, atau saat Anda membutuhkan
    jalur instalasi npm langsung selama migrasi:

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
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket di bawah `~/.openclaw/npm` dengan skrip lifecycle dinonaktifkan. Jaga pohon dependensi Plugin tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Startup Gateway tidak menginstal dependensi Plugin. Alur instalasi npm/git/ClawHub memiliki konvergensi dependensi; Plugin lokal harus sudah memiliki dependensi yang terinstal.
</Note>

Metadata paket bawaan bersifat eksplisit, bukan disimpulkan dari JavaScript yang dibangun saat startup Gateway. Dependensi runtime berada di paket Plugin yang memilikinya; startup OpenClaw yang dipaketkan tidak pernah memperbaiki atau mencerminkan dependensi Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifes Plugin](/id/plugins/manifest) — referensi skema manifes lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
