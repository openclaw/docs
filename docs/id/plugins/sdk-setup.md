---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah Plugin
    - Anda perlu memahami perbedaan antara setup-entry.ts dan index.ts
    - Anda sedang mendefinisikan skema konfigurasi Plugin atau metadata `openclaw` di `package.json`
sidebarTitle: Setup and config
summary: Panduan penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan Plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara penggunaan membahas pengemasan dalam konteks: [Plugin saluran](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin penyedia](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan kolom `openclaw` yang memberi tahu sistem Plugin apa yang disediakan Plugin Anda:

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
Jika Anda memublikasikan Plugin secara eksternal di ClawHub, kolom `compat` dan `build` tersebut wajib ada. Cuplikan publikasi kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Kolom `openclaw`

<ParamField path="extensions" type="string[]">
  Berkas titik masuk (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog saluran untuk penyiapan, pemilih, quickstart, dan permukaan status.
</ParamField>
<ParamField path="providers" type="string[]">
  ID penyedia yang didaftarkan oleh Plugin ini.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku startup.
</ParamField>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan saluran dan permukaan penyiapan sebelum runtime dimuat.

| Kolom                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID saluran kanonis.                                                           |
| `label`                                | `string`   | Label saluran utama.                                                          |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan saat harus berbeda dari `label`.                      |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog saluran dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur dokumentasi untuk tautan penyiapan dan pemilihan.                       |
| `docsLabel`                            | `string`   | Label pengganti yang digunakan untuk tautan dokumentasi saat harus berbeda dari ID saluran. |
| `blurb`                                | `string`   | Deskripsi singkat untuk onboarding/katalog.                                   |
| `order`                                | `number`   | Urutan pengurutan dalam katalog saluran.                                      |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan saluran.                             |
| `preferOver`                           | `string[]` | ID Plugin/saluran prioritas lebih rendah yang harus dikalahkan saluran ini.   |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI saluran.                     |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan dokumentasi di permukaan pemilihan.                |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur dokumentasi secara langsung alih-alih tautan dokumentasi berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai saluran sebagai mendukung markdown untuk keputusan pemformatan keluar. |
| `exposure`                             | `object`   | Kontrol visibilitas saluran untuk penyiapan, daftar terkonfigurasi, dan permukaan dokumentasi. |
| `quickstartAllowFrom`                  | `boolean`  | Ikutkan saluran ini ke dalam alur penyiapan quickstart `allowFrom` standar.   |
| `forceAccountBinding`                  | `boolean`  | Wajibkan pengikatan akun eksplisit bahkan saat hanya ada satu akun.           |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Utamakan pencarian sesi saat menyelesaikan target pengumuman untuk saluran ini. |

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

- `configured`: sertakan saluran dalam permukaan daftar bergaya terkonfigurasi/status
- `setup`: sertakan saluran dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: tandai saluran sebagai menghadap publik dalam permukaan dokumentasi/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Kolom                        | Tipe                                | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk alur instal/perbarui dan instal saat diperlukan onboarding. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur fallback instal/perbarui.                      |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau instalasi bawaan.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber instalasi pilihan saat tersedia beberapa sumber.                           |
| `minHostVersion`             | `string`                            | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z` atau `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi terpancang. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur instal ulang Plugin bawaan memulihkan kegagalan konfigurasi usang tertentu. |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan instal saat diperlukan. Jika Plugin Anda mengekspos pilihan auth penyedia atau metadata penyiapan/katalog saluran sebelum runtime dimuat, onboarding dapat menampilkan pilihan itu, meminta instalasi ClawHub, npm, atau lokal, menginstal atau mengaktifkan Plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding ClawHub menggunakan `clawhubSpec` dan diutamakan saat tersedia; pilihan npm memerlukan metadata katalog tepercaya dengan `npmSpec` registry; versi persis dan `expectedIntegrity` adalah pin npm opsional. Jika `expectedIntegrity` ada, alur instal/perbarui memberlakukannya untuk npm. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    Jika `minHostVersion` disetel, pemuatan instalasi dan registry manifes non-bawaan sama-sama memberlakukannya. Host yang lebih lama melewati Plugin eksternal; string versi tidak valid ditolak. Plugin sumber bawaan diasumsikan diversi bersama dengan checkout host.
  </Accordion>
  <Accordion title="Pinned npm installs">
    Untuk instalasi npm terpancang, simpan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi rusak. Ini hanya untuk pemulihan Plugin bawaan yang sempit, sehingga instal ulang/penyiapan dapat memperbaiki sisa peningkatan yang diketahui seperti jalur Plugin bawaan yang hilang atau entri `channels.<id>` usang untuk Plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Pemuatan penuh yang ditangguhkan

Plugin saluran dapat memilih pemuatan tertunda dengan:

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup sebelum listen, bahkan untuk saluran yang sudah dikonfigurasi. Entri penuh dimuat setelah Gateway mulai listening.

<Warning>
Aktifkan pemuatan tertunda hanya saat `setupEntry` Anda mendaftarkan semua yang dibutuhkan Gateway sebelum mulai listening (pendaftaran saluran, rute HTTP, metode Gateway). Jika entri penuh memiliki kapabilitas startup yang diperlukan, pertahankan perilaku default.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC Gateway, pertahankan pada prefiks khusus Plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diselesaikan ke `operator.admin`.

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
Alias publish lama yang hanya untuk skill ditujukan untuk skills. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri penyiapan

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw saat hanya memerlukan permukaan penyiapan (onboarding, perbaikan konfigurasi, inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime yang berat (pustaka crypto, registrasi CLI, layanan latar belakang) selama alur penyiapan.

Channel workspace bawaan yang menyimpan ekspor aman-penyiapan di modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract` alih-alih `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional sehingga wiring runtime saat penyiapan dapat tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Saat OpenClaw menggunakan setupEntry alih-alih entri penuh">
    - Channel dinonaktifkan tetapi memerlukan permukaan penyiapan/onboarding.
    - Channel diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Yang harus didaftarkan setupEntry">
    - Objek Plugin channel (melalui `defineSetupPluginEntry`).
    - Rute HTTP apa pun yang diperlukan sebelum gateway listen.
    - Metode Gateway apa pun yang diperlukan selama startup.

    Metode Gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Yang TIDAK boleh disertakan setupEntry">
    - Registrasi CLI.
    - Layanan latar belakang.
    - Impor runtime berat (crypto, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper penyiapan yang sempit

Untuk jalur panas khusus penyiapan, pilih seam helper penyiapan yang sempit daripada umbrella `plugin-sdk/setup` yang lebih luas saat Anda hanya memerlukan sebagian permukaan penyiapan:

| Jalur impor                        | Gunakan untuk                                                                                | Ekspor utama                                                                                                                                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat penyiapan yang tetap tersedia di `setupEntry` / startup channel tertunda | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias kompatibilitas yang usang; gunakan `plugin-sdk/setup-runtime`                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | helper CLI/arsip/dokumen untuk penyiapan/instalasi                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Gunakan seam `plugin-sdk/setup` yang lebih luas saat Anda menginginkan seluruh toolbox penyiapan bersama, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Adapter patch penyiapan tetap aman untuk jalur panas saat diimpor. Lookup permukaan kontrak promosi akun tunggal bawaannya bersifat lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak langsung memuat discovery permukaan kontrak bawaan sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik channel

Saat sebuah channel ditingkatkan dari konfigurasi tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai berskala akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi tersebut melalui permukaan kontrak penyiapannya:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: saat akun bernama sudah ada, hanya kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root channel
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

### Membuat skema konfigurasi channel

Gunakan `buildChannelConfigSchema` untuk mengonversi skema Zod menjadi pembungkus `ChannelConfigSchema` yang digunakan oleh artefak konfigurasi milik Plugin:

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

Untuk Plugin pihak ketiga, kontrak jalur dingin tetap berupa manifest Plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` sehingga skema konfigurasi, penyiapan, dan permukaan UI dapat menginspeksi `channels.<id>` tanpa memuat kode runtime.

## Wizard penyiapan

Plugin channel dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`. Wizard adalah objek `ChannelSetupWizard` pada `ChannelPlugin`:

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
    Untuk prompt daftar izin DM yang hanya memerlukan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper penyiapan bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Status penyiapan channel standar">
    Untuk blok status penyiapan channel yang hanya berbeda pada label, skor, dan baris tambahan opsional, pilih `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` alih-alih membuat objek `status` yang sama secara manual di setiap Plugin.
  </Accordion>
  <Accordion title="Permukaan penyiapan channel opsional">
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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` saat Anda hanya memerlukan salah satu bagian dari permukaan instal-opsional tersebut.

    Adapter/wizard opsional yang dihasilkan gagal secara tertutup pada penulisan konfigurasi nyata. Mereka menggunakan kembali satu pesan instalasi-diperlukan di `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen saat `docsPath` diatur.

  </Accordion>
  <Accordion title="Helper penyiapan berbasis biner">
    Untuk UI penyiapan berbasis biner, pilih helper delegasi bersama alih-alih menyalin glue biner/status yang sama ke setiap channel:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan ke wizard penuh yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` saat `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Menerbitkan dan menginstal

**Plugin eksternal:** terbitkan ke [ClawHub](/id/clawhub), lalu instal:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Spesifikasi paket bare diinstal dari npm selama cutover peluncuran.

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Gunakan npm saat sebuah paket belum berpindah ke ClawHub, atau saat Anda memerlukan
    jalur instal npm langsung selama migrasi:

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
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket di bawah `~/.openclaw/npm` dengan skrip lifecycle dinonaktifkan. Pertahankan pohon dependensi Plugin sebagai JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Startup Gateway tidak menginstal dependensi Plugin. Alur instalasi npm/git/ClawHub bertanggung jawab atas konvergensi dependensi; Plugin lokal harus sudah memiliki dependensinya terinstal.
</Note>

Metadata paket bawaan bersifat eksplisit, bukan disimpulkan dari JavaScript yang telah dibangun saat startup Gateway. Dependensi runtime berada dalam paket Plugin yang memilikinya; startup OpenClaw terpaket tidak pernah memperbaiki atau mencerminkan dependensi Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifes Plugin](/id/plugins/manifest) — referensi skema manifes lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
