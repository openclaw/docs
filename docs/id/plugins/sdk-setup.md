---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah plugin
    - Anda perlu memahami setup-entry.ts vs index.ts
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata openclaw package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-07-04T15:36:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
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
Jika Anda menerbitkan plugin secara eksternal di ClawHub, bidang `compat` dan `build` tersebut wajib. Cuplikan publikasi kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Bidang `openclaw`

<ParamField path="extensions" type="string[]">
  File titik masuk (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog channel untuk permukaan penyiapan, pemilih, mulai cepat, dan status.
</ParamField>
<ParamField path="providers" type="string[]">
  ID provider yang didaftarkan oleh plugin ini.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk pemasangan: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
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
| `order`                                | `number`   | Urutan sortir dalam katalog channel.                                          |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan channel.                             |
| `preferOver`                           | `string[]` | ID plugin/channel berprioritas lebih rendah yang harus dikalahkan channel ini. |
| `systemImage`                          | `string`   | Nama ikon/gambar sistem opsional untuk katalog UI channel.                    |
| `selectionDocsPrefix`                  | `string`   | Teks prefiks sebelum tautan docs di permukaan pemilihan.                      |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur docs secara langsung alih-alih tautan docs berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai channel sebagai mendukung markdown untuk keputusan pemformatan keluar. |
| `exposure`                             | `object`   | Kontrol visibilitas channel untuk permukaan penyiapan, daftar terkonfigurasi, dan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Ikutkan channel ini ke alur penyiapan `allowFrom` mulai cepat standar.        |
| `forceAccountBinding`                  | `boolean`  | Wajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun.          |
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

- `configured`: menyertakan channel dalam permukaan daftar bergaya terkonfigurasi/status
- `setup`: menyertakan channel dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: menandai channel sebagai menghadap publik dalam permukaan docs/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias legacy. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Bidang                       | Tipe                                | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk alur pemasangan/pembaruan dan pemasangan sesuai kebutuhan saat onboarding. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur fallback pemasangan/pembaruan.                 |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau pemasangan bawaan.                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber pemasangan pilihan saat beberapa sumber tersedia.                          |
| `minHostVersion`             | `string`                            | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z` atau `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk pemasangan yang dipin. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur pemasangan ulang plugin bawaan memulihkan kegagalan konfigurasi usang tertentu. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm khusus platform wajib yang diverifikasi selama pemasangan npm.          |

<AccordionGroup>
  <Accordion title="Perilaku onboarding">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan pemasangan sesuai kebutuhan. Jika plugin Anda mengekspos pilihan autentikasi provider atau metadata penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan tersebut, meminta pemasangan ClawHub, npm, atau lokal, memasang atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding ClawHub menggunakan `clawhubSpec` dan diprioritaskan jika ada; pilihan npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi persis dan `expectedIntegrity` adalah pin npm opsional. Jika `expectedIntegrity` ada, alur pemasangan/pembaruan menegakkannya untuk npm. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara memasangnya" di `package.json`.
  </Accordion>
  <Accordion title="Penegakan minHostVersion">
    Jika `minHostVersion` disetel, pemasangan dan pemuatan registry manifes non-bawaan sama-sama menegakkannya. Host yang lebih lama melewati plugin eksternal; string versi yang tidak valid ditolak. Plugin sumber bawaan diasumsikan memiliki versi yang sama dengan checkout host.
  </Accordion>
  <Accordion title="Pemasangan npm yang dipin">
    Untuk pemasangan npm yang dipin, simpan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan pintasan umum untuk konfigurasi rusak. Ini hanya untuk pemulihan plugin bawaan yang sempit, sehingga pemasangan ulang/penyiapan dapat memperbaiki sisa peningkatan yang diketahui seperti jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, pemasangan tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Pemuatan penuh yang ditunda

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup pra-listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah gateway mulai listen.

<Warning>
Aktifkan pemuatan tertunda hanya ketika `setupEntry` Anda mendaftarkan semua yang dibutuhkan gateway sebelum mulai listen (pendaftaran channel, rute HTTP, metode gateway). Jika entri penuh memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC gateway, pertahankan pada prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diselesaikan ke `operator.admin`.

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

Bahkan plugin tanpa konfigurasi pun harus mengirimkan skema. Skema kosong valid:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Lihat [manifes Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Penerbitan ClawHub

Untuk paket plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias penerbitan lama yang hanya untuk skill digunakan untuk skills. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri setup

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw saat hanya membutuhkan permukaan setup (onboarding, perbaikan konfigurasi, inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime berat (pustaka kriptografi, registrasi CLI, layanan latar belakang) selama alur setup.

Channel workspace bawaan yang menyimpan ekspor aman-setup di modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract` alih-alih `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional sehingga wiring runtime saat setup dapat tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Saat OpenClaw menggunakan setupEntry alih-alih entri penuh">
    - Channel dinonaktifkan tetapi membutuhkan permukaan setup/onboarding.
    - Channel diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Yang harus didaftarkan setupEntry">
    - Objek plugin channel (melalui `defineSetupPluginEntry`).
    - Route HTTP apa pun yang diperlukan sebelum gateway listen.
    - Metode gateway apa pun yang diperlukan selama startup.

    Metode gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Yang TIDAK boleh disertakan setupEntry">
    - Registrasi CLI.
    - Layanan latar belakang.
    - Impor runtime berat (kriptografi, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper setup sempit

Untuk jalur panas yang hanya untuk setup, pilih seam helper setup yang sempit daripada payung `plugin-sdk/setup` yang lebih luas saat Anda hanya membutuhkan sebagian permukaan setup:

| Jalur impor                        | Gunakan untuk                                                                                | Ekspor utama                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda     | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime`            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper setup/instalasi CLI/arsip/dokumentasi                                                 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan toolbox setup bersama yang lengkap, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gunakan `createSetupTranslator(...)` untuk salinan wizard setup tetap. Ini mengikuti locale wizard
CLI (`OPENCLAW_LOCALE`, lalu variabel locale sistem) dan melakukan fallback
ke bahasa Inggris. Simpan teks setup khusus plugin dalam kode milik plugin dan gunakan
kunci katalog bersama hanya untuk label setup umum, teks status, dan salinan setup
plugin bawaan resmi.

Adapter patch setup tetap aman untuk jalur panas saat diimpor. Lookup permukaan kontrak promosi akun tunggal bawaannya bersifat lazy, jadi mengimpor `plugin-sdk/setup-runtime` tidak langsung memuat discovery permukaan kontrak bawaan sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik channel

Saat channel ditingkatkan dari konfigurasi tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai yang dipromosikan dengan cakupan akun ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi tersebut melalui permukaan kontrak setupnya:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya kunci-kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
</Note>

## Skema konfigurasi

Konfigurasi plugin divalidasi terhadap JSON Schema di manifes Anda. Pengguna mengonfigurasi plugin melalui:

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

### Membuat skema konfigurasi channel

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi wrapper `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik plugin:

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

Untuk plugin pihak ketiga, kontrak jalur dingin tetap berupa manifes plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` sehingga skema konfigurasi, setup, dan permukaan UI dapat menginspeksi `channels.<id>` tanpa memuat kode runtime.

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

Tipe `ChannelSetupWizard` mendukung `credentials`, `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya. Lihat paket plugin bawaan (misalnya plugin Discord `src/channel.setup.ts`) untuk contoh lengkap.

<AccordionGroup>
  <Accordion title="Prompt allowFrom bersama">
    Untuk prompt allowlist DM yang hanya membutuhkan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper setup bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status setup channel standar">
    Untuk blok status setup channel yang hanya berbeda pada label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat sendiri objek `status` yang sama di setiap plugin.
  </Accordion>
  <Accordion title="Permukaan setup channel opsional">
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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` saat Anda hanya membutuhkan salah satu bagian dari permukaan instalasi opsional tersebut.

    Adapter/wizard opsional yang dihasilkan gagal tertutup pada penulisan konfigurasi nyata. Mereka menggunakan kembali satu pesan perlu-instal di seluruh `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumentasi saat `docsPath` diatur.

  </Accordion>
  <Accordion title="Helper setup berbasis biner">
    Untuk UI setup berbasis biner, pilih helper delegasi bersama alih-alih menyalin glue biner/status yang sama ke setiap channel:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` ketika `setupEntry` perlu meneruskan ke wizard lengkap yang lebih berat secara malas
    - `createDelegatedTextInputShouldPrompt(...)` ketika `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Menerbitkan dan menginstal

**Plugin eksternal:** terbitkan ke [ClawHub](/clawhub), lalu instal:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Spesifikasi paket tanpa prefiks diinstal dari npm selama cutover peluncuran.

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Gunakan npm ketika sebuah paket belum dipindahkan ke ClawHub, atau ketika Anda membutuhkan
    jalur instalasi npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repo:** tempatkan di bawah pohon workspace plugin bundel dan plugin tersebut akan otomatis ditemukan selama build.

**Pengguna dapat menginstal:**

```bash
openclaw plugins install <package-name>
```

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket ke proyek per-plugin di bawah `~/.openclaw/npm/projects` dengan skrip siklus hidup dinonaktifkan. Jaga agar pohon dependensi plugin tetap murni JS/TS dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Startup Gateway tidak menginstal dependensi plugin. Alur instalasi npm/git/ClawHub memiliki konvergensi dependensi; plugin lokal harus sudah memiliki dependensinya terinstal.
</Note>

Metadata paket bundel bersifat eksplisit, tidak disimpulkan dari JavaScript yang sudah dibangun saat startup Gateway. Dependensi runtime berada di paket plugin yang memilikinya; startup OpenClaw terpaket tidak pernah memperbaiki atau mencerminkan dependensi plugin.

## Terkait

- [Membangun plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifes Plugin](/id/plugins/manifest) — referensi skema manifes lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
