---
read_when:
    - Anda sedang menambahkan wizard penyiapan ke sebuah plugin
    - Anda perlu memahami setup-entry.ts dibandingkan dengan index.ts
    - Anda sedang mendefinisikan skema konfigurasi plugin atau metadata openclaw package.json
sidebarTitle: Setup and config
summary: Wizard penyiapan, setup-entry.ts, skema konfigurasi, dan metadata package.json
title: Penyiapan dan konfigurasi Plugin
x-i18n:
    generated_at: "2026-06-27T17:59:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Referensi untuk pengemasan Plugin (metadata `package.json`), manifes (`openclaw.plugin.json`), entri penyiapan, dan skema config.

<Tip>
**Mencari panduan langkah demi langkah?** Panduan cara pakai membahas pengemasan dalam konteks: [Plugin kanal](/id/plugins/sdk-channel-plugins#step-1-package-and-manifest) dan [Plugin penyedia](/id/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Metadata paket

`package.json` Anda memerlukan field `openclaw` yang memberi tahu sistem Plugin apa yang disediakan Plugin Anda:

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
Jika Anda memublikasikan Plugin secara eksternal di ClawHub, field `compat` dan `build` tersebut wajib ada. Cuplikan publikasi kanonis berada di `docs/snippets/plugin-publish/`.
</Note>

### Field `openclaw`

<ParamField path="extensions" type="string[]">
  File entry point (relatif terhadap root paket).
</ParamField>
<ParamField path="setupEntry" type="string">
  Entri khusus penyiapan yang ringan (opsional).
</ParamField>
<ParamField path="channel" type="object">
  Metadata katalog kanal untuk permukaan penyiapan, pemilih, quickstart, dan status.
</ParamField>
<ParamField path="providers" type="string[]">
  Id penyedia yang didaftarkan oleh Plugin ini.
</ParamField>
<ParamField path="install" type="object">
  Petunjuk instalasi: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`.
</ParamField>
<ParamField path="startup" type="object">
  Flag perilaku startup.
</ParamField>

### `openclaw.channel`

`openclaw.channel` adalah metadata paket ringan untuk penemuan kanal dan permukaan penyiapan sebelum runtime dimuat.

| Field                                  | Tipe       | Artinya                                                                       |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | Id kanal kanonis.                                                             |
| `label`                                | `string`   | Label kanal utama.                                                            |
| `selectionLabel`                       | `string`   | Label pemilih/penyiapan ketika harus berbeda dari `label`.                    |
| `detailLabel`                          | `string`   | Label detail sekunder untuk katalog kanal dan permukaan status yang lebih kaya. |
| `docsPath`                             | `string`   | Path docs untuk tautan penyiapan dan pemilihan.                               |
| `docsLabel`                            | `string`   | Override label yang digunakan untuk tautan docs ketika harus berbeda dari id kanal. |
| `blurb`                                | `string`   | Deskripsi singkat onboarding/katalog.                                         |
| `order`                                | `number`   | Urutan pengurutan dalam katalog kanal.                                        |
| `aliases`                              | `string[]` | Alias pencarian tambahan untuk pemilihan kanal.                               |
| `preferOver`                           | `string[]` | Id Plugin/kanal berprioritas lebih rendah yang harus dikalahkan kanal ini.    |
| `systemImage`                          | `string`   | Nama ikon/system-image opsional untuk katalog UI kanal.                       |
| `selectionDocsPrefix`                  | `string`   | Teks awalan sebelum tautan docs pada permukaan pemilihan.                     |
| `selectionDocsOmitLabel`               | `boolean`  | Tampilkan path docs secara langsung alih-alih tautan docs berlabel dalam salinan pemilihan. |
| `selectionExtras`                      | `string[]` | String pendek tambahan yang ditambahkan dalam salinan pemilihan.              |
| `markdownCapable`                      | `boolean`  | Menandai kanal sebagai mampu markdown untuk keputusan pemformatan keluar.     |
| `exposure`                             | `object`   | Kontrol visibilitas kanal untuk permukaan penyiapan, daftar terkonfigurasi, dan docs. |
| `quickstartAllowFrom`                  | `boolean`  | Mengikutkan kanal ini ke alur penyiapan `allowFrom` quickstart standar.       |
| `forceAccountBinding`                  | `boolean`  | Mewajibkan pengikatan akun eksplisit bahkan ketika hanya ada satu akun.       |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Mengutamakan pencarian sesi saat menyelesaikan target pengumuman untuk kanal ini. |

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

- `configured`: sertakan kanal dalam permukaan daftar bergaya terkonfigurasi/status
- `setup`: sertakan kanal dalam pemilih penyiapan/configure interaktif
- `docs`: tandai kanal sebagai tampil publik dalam permukaan docs/navigasi

<Note>
`showConfigured` dan `showInSetup` tetap didukung sebagai alias lama. Utamakan `exposure`.
</Note>

### `openclaw.install`

`openclaw.install` adalah metadata paket, bukan metadata manifes.

| Bidang                       | Tipe                                | Artinya                                                                           |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | Spesifikasi ClawHub kanonis untuk alur install/update dan onboarding install-on-demand. |
| `npmSpec`                    | `string`                            | Spesifikasi npm kanonis untuk alur fallback install/update.                       |
| `localPath`                  | `string`                            | Jalur pengembangan lokal atau instalasi bawaan.                                   |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | Sumber instalasi pilihan saat beberapa sumber tersedia.                           |
| `minHostVersion`             | `string`                            | Versi OpenClaw minimum yang didukung dalam bentuk `>=x.y.z` atau `>=x.y.z-prerelease`. |
| `expectedIntegrity`          | `string`                            | String integritas dist npm yang diharapkan, biasanya `sha512-...`, untuk instalasi yang dipin. |
| `allowInvalidConfigRecovery` | `boolean`                           | Memungkinkan alur reinstall plugin bawaan memulihkan kegagalan konfigurasi usang tertentu. |
| `requiredPlatformPackages`   | `string[]`                          | Alias npm khusus platform yang wajib dan diverifikasi selama instalasi npm.        |

<AccordionGroup>
  <Accordion title="Perilaku onboarding">
    Onboarding interaktif juga menggunakan `openclaw.install` untuk permukaan install-on-demand. Jika plugin Anda mengekspos pilihan auth provider atau metadata penyiapan/katalog channel sebelum runtime dimuat, onboarding dapat menampilkan pilihan tersebut, meminta instalasi ClawHub, npm, atau lokal, menginstal atau mengaktifkan plugin, lalu melanjutkan alur yang dipilih. Pilihan onboarding ClawHub menggunakan `clawhubSpec` dan diprioritaskan jika ada; pilihan npm memerlukan metadata katalog tepercaya dengan registry `npmSpec`; versi persis dan `expectedIntegrity` adalah pin npm opsional. Jika `expectedIntegrity` ada, alur install/update akan menegakkannya untuk npm. Simpan metadata "apa yang ditampilkan" di `openclaw.plugin.json` dan metadata "cara menginstalnya" di `package.json`.
  </Accordion>
  <Accordion title="Penegakan minHostVersion">
    Jika `minHostVersion` disetel, instalasi dan pemuatan manifest-registry non-bawaan sama-sama menegakkannya. Host lama melewati plugin eksternal; string versi yang tidak valid ditolak. Plugin sumber bawaan diasumsikan memiliki versi yang sama dengan checkout host.
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
    `allowInvalidConfigRecovery` bukan bypass umum untuk konfigurasi yang rusak. Ini hanya untuk pemulihan plugin bawaan yang sempit, sehingga reinstall/setup dapat memperbaiki sisa upgrade yang diketahui seperti jalur plugin bawaan yang hilang atau entri `channels.<id>` usang untuk plugin yang sama. Jika konfigurasi rusak karena alasan yang tidak terkait, instalasi tetap gagal tertutup dan memberi tahu operator untuk menjalankan `openclaw doctor --fix`.
  </Accordion>
</AccordionGroup>

### Pemuatan penuh yang ditangguhkan

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

Saat diaktifkan, OpenClaw hanya memuat `setupEntry` selama fase startup pra-listen, bahkan untuk channel yang sudah dikonfigurasi. Entri penuh dimuat setelah Gateway mulai mendengarkan.

<Warning>
Aktifkan pemuatan tertunda hanya jika `setupEntry` Anda mendaftarkan semua yang dibutuhkan Gateway sebelum mulai mendengarkan (pendaftaran channel, rute HTTP, metode Gateway). Jika entri penuh memiliki kapabilitas startup yang wajib, pertahankan perilaku default.
</Warning>

Jika entri setup/penuh Anda mendaftarkan metode RPC Gateway, pertahankan metode tersebut pada prefiks khusus plugin. Namespace admin inti yang dicadangkan (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) tetap dimiliki inti dan selalu diselesaikan ke `operator.admin`.

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

Lihat [Manifes Plugin](/id/plugins/manifest) untuk referensi skema lengkap.

## Publikasi ClawHub

Untuk paket plugin, gunakan perintah ClawHub khusus paket:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
Alias publikasi lama khusus skill ditujukan untuk skills. Paket Plugin harus selalu menggunakan `clawhub package publish`.
</Note>

## Entri setup

File `setup-entry.ts` adalah alternatif ringan untuk `index.ts` yang dimuat OpenClaw ketika hanya membutuhkan permukaan setup (onboarding, perbaikan konfigurasi, inspeksi channel yang dinonaktifkan).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Ini menghindari pemuatan kode runtime berat (pustaka kriptografi, pendaftaran CLI, layanan latar belakang) selama alur setup.

Channel workspace bawaan yang menyimpan ekspor aman-setup di modul sidecar dapat menggunakan `defineBundledChannelSetupEntry(...)` dari `openclaw/plugin-sdk/channel-entry-contract`, bukan `defineSetupPluginEntry(...)`. Kontrak bawaan itu juga mendukung ekspor `runtime` opsional agar wiring runtime saat setup tetap ringan dan eksplisit.

<AccordionGroup>
  <Accordion title="Kapan OpenClaw menggunakan setupEntry alih-alih entri penuh">
    - Channel dinonaktifkan tetapi membutuhkan permukaan setup/onboarding.
    - Channel diaktifkan tetapi belum dikonfigurasi.
    - Pemuatan tertunda diaktifkan (`deferConfiguredChannelFullLoadUntilAfterListen`).

  </Accordion>
  <Accordion title="Apa yang harus didaftarkan setupEntry">
    - Objek plugin channel (melalui `defineSetupPluginEntry`).
    - Rute HTTP apa pun yang diperlukan sebelum gateway listen.
    - Metode gateway apa pun yang diperlukan saat startup.

    Metode gateway startup tersebut tetap harus menghindari namespace admin inti yang dicadangkan seperti `config.*` atau `update.*`.

  </Accordion>
  <Accordion title="Apa yang TIDAK boleh disertakan setupEntry">
    - Pendaftaran CLI.
    - Layanan latar belakang.
    - Impor runtime berat (kriptografi, SDK).
    - Metode Gateway yang hanya diperlukan setelah startup.

  </Accordion>
</AccordionGroup>

### Impor helper setup sempit

Untuk jalur panas yang hanya setup, pilih seam helper setup yang sempit daripada payung `plugin-sdk/setup` yang lebih luas ketika Anda hanya membutuhkan sebagian permukaan setup:

| Jalur impor                       | Gunakan untuk                                                                                 | Ekspor utama                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | helper runtime saat setup yang tetap tersedia di `setupEntry` / startup channel tertunda       | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | alias kompatibilitas yang tidak digunakan lagi; gunakan `plugin-sdk/setup-runtime`             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | helper setup/instalasi CLI/arsip/dokumen                                                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

Gunakan seam `plugin-sdk/setup` yang lebih luas ketika Anda menginginkan toolbox setup bersama yang lengkap, termasuk helper patch konfigurasi seperti `moveSingleAccountChannelSectionToDefaultAccount(...)`.

Gunakan `createSetupTranslator(...)` untuk teks wizard setup tetap. Ini mengikuti
lokal wizard CLI (`OPENCLAW_LOCALE`, lalu variabel lokal sistem) dan melakukan
fallback ke bahasa Inggris. Simpan teks setup khusus plugin di kode milik plugin dan gunakan
kunci katalog bersama hanya untuk label setup umum, teks status, dan teks setup plugin
bawaan resmi.

Adapter patch setup tetap aman untuk jalur panas saat diimpor. Lookup permukaan kontrak promosi akun tunggal bawaan bersifat lazy, sehingga mengimpor `plugin-sdk/setup-runtime` tidak memuat discovery permukaan kontrak bawaan secara eager sebelum adapter benar-benar digunakan.

### Promosi akun tunggal milik channel

Ketika channel ditingkatkan dari konfigurasi tingkat atas akun tunggal ke `channels.<id>.accounts.*`, perilaku bersama default adalah memindahkan nilai cakupan akun yang dipromosikan ke `accounts.default`.

Channel bawaan dapat mempersempit atau menimpa promosi tersebut melalui permukaan kontrak setup mereka:

- `singleAccountKeysToMove`: kunci tingkat atas tambahan yang harus dipindahkan ke akun yang dipromosikan
- `namedAccountPromotionKeys`: ketika akun bernama sudah ada, hanya kunci ini yang dipindahkan ke akun yang dipromosikan; kunci kebijakan/pengiriman bersama tetap berada di root channel
- `resolveSingleAccountPromotionTarget(...)`: pilih akun yang sudah ada yang menerima nilai yang dipromosikan

<Note>
Matrix adalah contoh bawaan saat ini. Jika tepat satu akun Matrix bernama sudah ada, atau jika `defaultAccount` menunjuk ke kunci non-kanonis yang sudah ada seperti `Ops`, promosi mempertahankan akun tersebut alih-alih membuat entri `accounts.default` baru.
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

Untuk plugin pihak ketiga, kontrak jalur dingin tetap berupa manifes plugin: cerminkan JSON Schema yang dihasilkan ke `openclaw.plugin.json#channelConfigs` agar skema konfigurasi, setup, dan permukaan UI dapat memeriksa `channels.<id>` tanpa memuat kode runtime.

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
    Untuk prompt daftar izin DM yang hanya membutuhkan alur standar `note -> prompt -> parse -> merge -> patch`, pilih helper setup bersama dari `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`, `createTopLevelChannelParsedAllowFromPrompt(...)`, dan `createNestedChannelParsedAllowFromPrompt(...)`.
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

    `plugin-sdk/channel-setup` juga mengekspos builder tingkat lebih rendah `createOptionalChannelSetupAdapter(...)` dan `createOptionalChannelSetupWizard(...)` ketika Anda hanya membutuhkan salah satu bagian dari permukaan instalasi opsional tersebut.

    Adapter/wizard opsional yang dihasilkan gagal tertutup pada penulisan konfigurasi nyata. Mereka menggunakan ulang satu pesan wajib-instalasi di seluruh `validateInput`, `applyAccountConfig`, dan `finalize`, serta menambahkan tautan dokumen ketika `docsPath` disetel.

  </Accordion>
  <Accordion title="Helper setup berbasis binary">
    Untuk UI setup berbasis binary, pilih helper delegasi bersama alih-alih menyalin glue binary/status yang sama ke setiap channel:

    - `createDetectedBinaryStatus(...)` untuk blok status yang hanya berbeda pada label, hint, skor, dan deteksi binary
    - `createCliPathTextInput(...)` untuk input teks berbasis jalur
    - `createDelegatedSetupWizardStatusResolvers(...)`, `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)`, dan `createDelegatedResolveConfigured(...)` ketika `setupEntry` perlu meneruskan ke wizard penuh yang lebih berat secara lazy
    - `createDelegatedTextInputShouldPrompt(...)` ketika `setupEntry` hanya perlu mendelegasikan keputusan `textInputs[*].shouldPrompt`

  </Accordion>
</AccordionGroup>

## Menerbitkan dan memasang

**Plugin eksternal:** terbitkan ke [ClawHub](/id/clawhub), lalu pasang:

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    Spesifikasi paket polos dipasang dari npm selama peralihan peluncuran.

  </Tab>
  <Tab title="Hanya ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="Spesifikasi paket npm">
    Gunakan npm ketika sebuah paket belum dipindahkan ke ClawHub, atau ketika Anda membutuhkan
    jalur pemasangan npm langsung selama migrasi:

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**Plugin dalam repo:** tempatkan di bawah pohon workspace Plugin terbundel dan mereka akan ditemukan secara otomatis selama build.

**Pengguna dapat memasang:**

```bash
openclaw plugins install <package-name>
```

<Info>
Untuk pemasangan yang bersumber dari npm, `openclaw plugins install` memasang paket ke dalam proyek per-Plugin di bawah `~/.openclaw/npm/projects` dengan skrip siklus hidup dinonaktifkan. Jaga pohon dependensi Plugin tetap JS/TS murni dan hindari paket yang memerlukan build `postinstall`.
</Info>

<Note>
Startup Gateway tidak memasang dependensi Plugin. Alur pemasangan npm/git/ClawHub menangani konvergensi dependensi; Plugin lokal harus sudah memasang dependensinya.
</Note>

Metadata paket terbundel bersifat eksplisit, bukan disimpulkan dari JavaScript hasil build saat startup Gateway. Dependensi runtime berada di paket Plugin yang memilikinya; startup OpenClaw terpaket tidak pernah memperbaiki atau mencerminkan dependensi Plugin.

## Terkait

- [Membangun Plugin](/id/plugins/building-plugins) — panduan langkah demi langkah untuk memulai
- [Manifest Plugin](/id/plugins/manifest) — referensi skema manifest lengkap
- [Titik masuk SDK](/id/plugins/sdk-entrypoints) — `definePluginEntry` dan `defineChannelPluginEntry`
