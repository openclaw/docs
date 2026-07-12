---
read_when:
    - Anda sedang menambahkan wisaya penyiapan ke sebuah plugin
    - Anda perlu memahami setup-entry.ts dibandingkan dengan index.ts
    - Anda sedang mendefinisikan skema konfigurasi plugin atau metadata openclaw dalam package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-07-12T14:33:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema konfigurasi.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara penggunaan membahas pengemasan dalam konteksnya: [Plugin saluran](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin penyedia](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan bidang `openclaw` yang memberi tahu sistem plugin tentang apa yang disediakan plugin Anda:

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
Publikasi eksternal di ClawHub memerlukan `compat` dan `build`. Cuplikan publikasi kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Bidang `openclaw`

<ParamField path="extensions" type="string[]">
  Berkas titik masuk (relatif terhadap akar paket). Entri sumber yang valid untuk pengembangan di ruang kerja dan checkout git.
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  Pasangan JavaScript hasil pembangunan untuk `extensions`, yang diutamakan saat OpenClaw memuat paket npm terinstal. Lihat [Titik masuk SDK](/id/plugins/sdk-entrypoints) untuk urutan resolusi sumber/hasil pembangunan.
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri ringan khusus penyiapan (opsional).
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  Pasangan JavaScript hasil pembangunan untuk `setupEntry`. Mengharuskan `setupEntry` juga ditetapkan.
</ParamField>
<ParamField path="plugin" type="object">
  Identitas plugin cadangan `{ id, label }`, digunakan ketika plugin tidak memiliki metadata saluran/penyedia sebagai sumber id atau label.
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog saluran untuk penyiapan, pemilih, mulai cepat, dan tampilan status.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`, `requiredPlatformPackages`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku saat mulai.
</ParamField>
<ParamField path="compat" type="object">
  Rentang versi `pluginApi` yang didukung plugin ini. Wajib untuk publikasi eksternal di ClawHub.
</ParamField>

<Note>
ID penyedia (`providers: string[]`) merupakan metadata manifes, bukan metadata paket. Deklarasikan di `openclaw.plugin.json`, bukan di sini — lihat [Manifes plugin](/id/plugins/manifest).
</Note>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan saluran dan tampilan penyiapan sebelum runtime dimuat.

| Bidang                                 | Jenis      | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | ID saluran kanonis.                                                           |
| `label`                                | `string`   | Label utama saluran.                                                          |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan ketika harus berbeda dari `label`.                    |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog saluran dan tampilan status yang lebih kaya. |
| `docsPath`                             | `string`   | Jalur dokumentasi untuk tautan penyiapan dan pemilihan.                       |
| `docsLabel`                            | `string`   | Penggantian label untuk tautan dokumentasi ketika harus berbeda dari ID saluran. |
| `blurb`                                | `string`   | Deskripsi singkat orientasi awal/katalog.                                     |
| `order`                                | `number`   | Urutan pengurutan dalam katalog saluran.                                      |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan saluran.                             |
| `preferOver`                           | `string[]` | ID plugin/saluran berprioritas lebih rendah yang harus dikalahkan saluran ini. |
| `systemImage`                          | `string`   | Nama ikon/gambar sistem opsional untuk katalog UI saluran.                    |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan dokumentasi pada tampilan pemilihan.               |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan jalur dokumentasi secara langsung alih-alih tautan dokumentasi berlabel dalam teks pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan ke teks pemilihan.                    |
| `markdownCapable`                      | `boolean`  | Menandai saluran sebagai berkemampuan Markdown untuk keputusan pemformatan keluar. |
| `exposure`                             | `object`   | Kontrol visibilitas saluran untuk penyiapan, daftar terkonfigurasi, dan tampilan dokumentasi. |
| `quickstartAllowFrom`                  | `boolean`  | Menyertakan saluran ini dalam alur penyiapan `allowFrom` mulai cepat standar. |
| `forceAccountBinding`                  | `boolean`  | Mewajibkan pengikatan akun secara eksplisit meskipun hanya ada satu akun.     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Mengutamakan pencarian sesi saat menyelesaikan target pengumuman untuk saluran ini. |

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

- `configured`: sertakan saluran dalam tampilan daftar bergaya terkonfigurasi/status
- `setup`: sertakan saluran dalam pemilih penyiapan/konfigurasi interaktif
- `docs`: tandai saluran sebagai dapat dilihat publik dalam tampilan dokumentasi/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Bidang                       | Jenis                               | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk alur instalasi/pembaruan dan instalasi sesuai permintaan saat orientasi awal. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur cadangan instalasi/pembaruan.                  |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau instalasi terbundel.                                |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber instalasi yang diutamakan ketika tersedia beberapa sumber.                 |
| `minHostVersion`             | `string`                            | Versi minimum OpenClaw yang didukung, `>=x.y.z` atau `>=x.y.z-prerelease`.        |
| `expectedIntegrity`          | `string`                            | String integritas distribusi npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang disematkan. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur instalasi ulang plugin terbundel memulihkan kegagalan konfigurasi usang tertentu. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm khusus platform yang diwajibkan dan diverifikasi selama instalasi npm.  |

<AccordionGroup>
  <Accordion title="Perilaku orientasi awal">
    Orientasi awal interaktif menggunakan `openclaw.install` untuk tampilan instalasi sesuai permintaan: jika plugin Anda mengekspos pilihan autentikasi penyedia atau metadata penyiapan/katalog saluran sebelum runtime dimuat, orientasi awal dapat meminta instalasi melalui ClawHub, npm, atau lokal, menginstal atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan ClawHub menggunakan `clawhubSpec` dan diutamakan jika tersedia; pilihan npm memerlukan metadata katalog tepercaya dengan `npmSpec` registri (versi persis dan `expectedIntegrity` merupakan sematan opsional yang diberlakukan saat instalasi/pembaruan jika ditetapkan). Simpan "apa yang ditampilkan" di `openclaw.plugin.json` dan "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="Pemberlakuan minHostVersion">
    Jika `minHostVersion` ditetapkan, instalasi dan pemuatan registri manifes non-terbundel sama-sama memberlakukannya. Host yang lebih lama melewati plugin eksternal; string versi yang tidak valid ditolak. Plugin sumber terbundel diasumsikan memiliki versi yang sama dengan checkout host.
  </Accordion>
  <Accordion title="Instalasi npm yang disematkan">
    Untuk instalasi npm yang disematkan, pertahankan versi persis di `npmSpec` dan tambahkan integritas artefak yang diharapkan:

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
    `allowInvalidConfigRecovery` bukan cara umum untuk melewati konfigurasi yang rusak. Ini hanya pemulihan sempit untuk plugin terbundel, yang memungkinkan instalasi ulang/penyiapan memperbaiki sisa peningkatan versi yang diketahui, seperti jalur plugin terbundel yang hilang atau entri `channels.<id>` usang untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal secara tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Penundaan pemuatan penuh

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

Jika diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase mulai sebelum mendengarkan, bahkan untuk saluran yang sudah dikonfigurasi. Entri penuh dimuat setelah gateway mulai mendengarkan.

<Warning>
Aktifkan pemuatan tertunda hanya jika `setupEntry` Anda mendaftarkan semua yang diperlukan gateway sebelum mulai mendengarkan (pendaftaran saluran, rute HTTP, metode gateway). Jika entri penuh memiliki kapabilitas mulai yang diperlukan, pertahankan perilaku bawaan.
</Warning>

Jika entri penyiapan/penuh Anda mendaftarkan metode RPC gateway, pertahankan metode tersebut pada awalan khusus plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu dinormalisasi menjadi `operator.admin`.

## Manifes plugin

Setiap plugin native harus menyertakan `openclaw.plugin.json` di root paket. OpenClaw menggunakannya untuk memvalidasi konfigurasi tanpa mengeksekusi kode plugin.

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

Untuk plugin saluran, tambahkan `channels` (dan plugin penyedia menambahkan `providers`):

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

Lihat [manifes plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Paket Skills dan plugin menggunakan perintah publikasi ClawHub yang terpisah. Untuk paket plugin, gunakan perintah khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` adalah perintah lain untuk memublikasikan folder skill, bukan paket plugin. Lihat [Publikasi di ClawHub](/id/clawhub/publishing).
</Note>

## Entri penyiapan

`setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw ketika hanya memerlukan permukaan penyiapan (orientasi awal, perbaikan konfigurasi, pemeriksaan saluran yang dinonaktifkan):

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Hal ini menghindari pemuatan kode runtime yang berat (pustaka kriptografi, pendaftaran CLI, layanan latar belakang) selama alur penyiapan.

Saluran ruang kerja bawaan yang menyimpan ekspor aman-penyiapan dalam modul pendamping dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract` sebagai pengganti `defineSetupPluginEntry(...)`. Kontrak bawaan tersebut juga mendukung ekspor opsional `runtime` agar pengkabelan runtime pada waktu penyiapan tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Saat OpenClaw menggunakan setupEntry alih-alih entri lengkap">
    - Saluran dinonaktifkan tetapi memerlukan permukaan penyiapan/orientasi awal.
    - Saluran diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Yang harus didaftarkan oleh setupEntry">
    - Objek plugin saluran (melalui `defineSetupPluginEntry`).
    - Semua rute HTTP yang diperlukan sebelum gateway mulai mendengarkan.
    - Semua metode gateway yang diperlukan selama proses awal.

    Metode gateway saat proses awal tersebut tetap harus menghindari namespace administrasi inti yang dicadangkan, seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Yang TIDAK boleh disertakan dalam setupEntry">
    - Pendaftaran CLI.
    - Layanan latar belakang.
    - Impor runtime yang berat (kriptografi, SDK).
    - Metode gateway yang hanya diperlukan setelah proses awal.

  </Accordion>
</AccordionGroup>

### Impor pembantu penyiapan terbatas

Untuk jalur aktif yang hanya digunakan dalam penyiapan, utamakan celah pembantu penyiapan yang terbatas daripada payung `plugin-sdk/setup` yang lebih luas jika Anda hanya memerlukan sebagian permukaan penyiapan:

| Jalur impor                        | Gunakan untuk                                                                                | Ekspor utama                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | pembantu runtime saat penyiapan yang tetap tersedia dalam `setupEntry` / proses awal saluran tertunda | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime`                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | pembantu CLI/arsip/dokumentasi untuk penyiapan/instalasi                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gunakan celah `plugin-sdk/setup` yang lebih luas jika Anda menginginkan kotak alat penyiapan bersama yang lengkap, termasuk pembantu tambalan konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gunakan `createSetupTranslator(...)` untuk teks tetap pada wizard penyiapan. Fungsi ini mengikuti lokal wizard CLI (`OPENCLAW_LOCALE`, kemudian variabel lokal sistem) dan kembali menggunakan bahasa Inggris jika lokal tersebut tidak tersedia. Pertahankan teks penyiapan khusus plugin dalam kode milik plugin dan gunakan kunci katalog bersama hanya untuk label penyiapan umum, teks status, dan teks penyiapan plugin resmi yang dibundel.

Adaptor patch penyiapan tetap aman untuk jalur panas saat diimpor. Pencarian permukaan kontrak promosi akun tunggal yang dibundel dilakukan secara malas, sehingga mengimpor `plugin-sdk/setup-runtime` tidak langsung memuat penemuan permukaan kontrak yang dibundel sebelum adaptor benar-benar digunakan.

### Promosi akun tunggal milik kanal

Saat kanal ditingkatkan dari konfigurasi tingkat atas untuk satu akun ke `channels.<id>.accounts.*`, perilaku bersama bawaan memindahkan nilai dalam cakupan akun yang dipromosikan ke `accounts.default`.

Kanal yang dibundel dapat mempersempit atau mengganti promosi tersebut melalui permukaan kontrak penyiapannya:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: jika akun bernama sudah ada, hanya kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di akar kanal
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

Jika Anda sudah menyusun kontrak sebagai JSON Schema atau TypeBox, gunakan pembantu langsung agar OpenClaw dapat melewati konversi Zod-ke-JSON-Schema pada jalur metadata:

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

Plugin kanal dapat menyediakan wizard penyiapan interaktif untuk `openclaw onboard`. Wizard tersebut merupakan objek `ChannelSetupWizard` pada `ChannelPlugin`:

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

`ChannelSetupWizard` juga mendukung `textInputs`, `dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize`, dan lainnya. Lihat `src/setup-core.ts` milik plugin Discord untuk contoh lengkap yang dibundel.

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    Untuk perintah daftar yang diizinkan DM yang hanya memerlukan alur standar `note -> prompt -> parse -> merge -> patch`, utamakan pembantu penyiapan bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
  </Accordion>
  <Accordion title="Standard channel setup status">
    Untuk blok status penyiapan kanal yang hanya berbeda dalam label, skor, dan baris tambahan opsional, utamakan `createStandardChannelSetupStatus(...)` dari `openclaw/plugin-sdk/setup` daripada membuat sendiri objek `status` yang sama di setiap plugin.
  </Accordion>
  <Accordion title="Optional channel setup surface">
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

    `plugin-sdk/channel-setup` juga menyediakan pembuat tingkat rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` jika Anda hanya memerlukan satu bagian dari permukaan instalasi opsional tersebut.

    Adaptor/wizard opsional yang dihasilkan gagal secara tertutup pada penulisan konfigurasi nyata. Keduanya menggunakan kembali satu pesan yang mewajibkan instalasi di seluruh `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumentasi saat `docsPath` ditetapkan.

  </Accordion>
  <Accordion title="Pembantu penyiapan berbasis biner">
    Untuk UI penyiapan berbasis biner, utamakan pembantu delegasi bersama daripada menyalin perekat biner/status yang sama ke setiap kanal:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda berdasarkan label, petunjuk, skor, dan deteksi biner
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` saat `setupEntry` perlu meneruskan secara malas ke wizard lengkap yang lebih berat
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

    Spesifikasi paket tanpa awalan diinstal dari npm selama peralihan peluncuran, kecuali jika namanya cocok dengan id Plugin bawaan atau resmi; dalam hal ini, OpenClaw menggunakan salinan lokal/resmi tersebut. Gunakan `clawhub:`, `npm:`, `git:`, atau `npm-pack:` untuk pemilihan sumber deterministik — lihat [Kelola Plugin](/id/plugins/manage-plugins).

  </Tab>
  <Tab title="Khusus ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Gunakan npm saat sebuah paket belum dipindahkan ke ClawHub, atau saat Anda memerlukan
    jalur instalasi npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repositori:** tempatkan di bawah pohon ruang kerja Plugin bawaan; Plugin tersebut ditemukan secara otomatis selama proses build.

<Info>
Untuk instalasi yang bersumber dari npm, `openclaw plugins install` menginstal paket ke proyek per Plugin di bawah `~/.openclaw/npm/projects` dengan skrip siklus hidup dinonaktifkan (`--ignore-scripts`). Pertahankan pohon dependensi Plugin sebagai JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Saat dimulai, Gateway tidak menginstal dependensi Plugin. Alur instalasi npm/git/ClawHub bertanggung jawab atas konvergensi dependensi; dependensi Plugin lokal harus sudah diinstal.
</Note>

Metadata paket bawaan ditentukan secara eksplisit, bukan disimpulkan dari JavaScript hasil build saat Gateway dimulai. Dependensi runtime harus berada dalam paket Plugin yang memilikinya; saat dimulai, OpenClaw yang telah dipaketkan tidak pernah memperbaiki atau mencerminkan dependensi Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan memulai langkah demi langkah
- [Manifes Plugin](/id/plugins/manifest) — referensi skema manifes lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
